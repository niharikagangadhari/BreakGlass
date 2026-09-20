-- ==============================================================================
-- BREAK GLASS - EMERGENCY ACCESS MANAGEMENT SYSTEM
-- Production Database Schema, Row Level Security, Triggers & Security Definer RPCs
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM CHECK DOMAINS
-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'operator', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Protected Resources Table
CREATE TABLE IF NOT EXISTS public.protected_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    sensitivity_level TEXT NOT NULL DEFAULT 'high' CHECK (sensitivity_level IN ('high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Emergency Requests Table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.protected_resources(id) ON DELETE RESTRICT,
    justification TEXT NOT NULL,
    requested_duration INTEGER NOT NULL CHECK (requested_duration IN (5, 15, 30, 60)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked', 'expired')),
    requested_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id)
);

-- Audit Logs Table (Immutable-style log trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_id UUID REFERENCES public.protected_resources(id) ON DELETE SET NULL,
    emergency_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. INDEXES FOR PERFORMANCE & AUDIT QUERYING
CREATE INDEX IF NOT EXISTS idx_emergency_requests_user ON public.emergency_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_expires ON public.emergency_requests(expires_at) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 4. SECURITY DEFINER HELPER: GET CURRENT USER ROLE
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = p_user_id;
$$;

-- 5. TRIGGER: AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protected_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_own_or_elevated"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR public.get_user_role(auth.uid()) IN ('operator', 'admin')
    );

CREATE POLICY "profiles_update_admin_only"
    ON public.profiles FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Protected Resources Policies
CREATE POLICY "resources_read_all_authenticated"
    ON public.protected_resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "resources_write_admin_only"
    ON public.protected_resources FOR ALL
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Emergency Requests Policies
-- Users can see their own requests; Operators and Admins can see all requests
CREATE POLICY "requests_select_policy"
    ON public.emergency_requests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.get_user_role(auth.uid()) IN ('operator', 'admin')
    );

-- Audit Logs Policies
-- Users see logs about their own actions; Operators and Admins see all logs
CREATE POLICY "audit_logs_select_policy"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.get_user_role(auth.uid()) IN ('operator', 'admin')
    );

-- 7. SECURITY DEFINER RPCS (CORE EMERGENCY WORKFLOW)

-- 7.1 REQUEST EMERGENCY ACCESS
CREATE OR REPLACE FUNCTION public.request_emergency_access(
    p_resource_id UUID,
    p_justification TEXT,
    p_duration_minutes INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_request_id UUID;
    v_resource_name TEXT;
BEGIN
    -- Validate authentication
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Validate resource exists
    SELECT name INTO v_resource_name FROM public.protected_resources WHERE id = p_resource_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid protected resource specified.';
    END IF;

    -- Validate justification length
    IF p_justification IS NULL OR length(trim(p_justification)) < 10 THEN
        RAISE EXCEPTION 'Justification must be at least 10 characters long.';
    END IF;

    -- Validate allowed durations
    IF p_duration_minutes NOT IN (5, 15, 30, 60) THEN
        RAISE EXCEPTION 'Requested duration must be 5, 15, 30, or 60 minutes.';
    END IF;

    -- Insert emergency request
    INSERT INTO public.emergency_requests (
        user_id,
        resource_id,
        justification,
        requested_duration,
        status,
        requested_at
    )
    VALUES (
        v_user_id,
        p_resource_id,
        trim(p_justification),
        p_duration_minutes,
        'pending',
        NOW()
    )
    RETURNING id INTO v_request_id;

    -- Write immutable audit entry
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_id,
        emergency_request_id,
        details,
        created_at
    )
    VALUES (
        v_user_id,
        'EMERGENCY_ACCESS_REQUESTED',
        p_resource_id,
        v_request_id,
        jsonb_build_object(
            'resource_name', v_resource_name,
            'duration_minutes', p_duration_minutes,
            'justification_length', length(trim(p_justification))
        ),
        NOW()
    );

    RETURN v_request_id;
END;
$$;

-- 7.2 APPROVE EMERGENCY ACCESS
CREATE OR REPLACE FUNCTION public.approve_emergency_access(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
    v_req RECORD;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Caller authentication
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Role verification
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role NOT IN ('operator', 'admin') THEN
        RAISE EXCEPTION 'Not authorized: Only operators and administrators can approve emergency requests.';
    END IF;

    -- Fetch and lock request
    SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Request cannot be approved because status is %.', v_req.status;
    END IF;

    -- Compute expiration
    v_expires_at := NOW() + (v_req.requested_duration || ' minutes')::INTERVAL;

    -- Update request
    UPDATE public.emergency_requests
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = v_caller_id,
        expires_at = v_expires_at
    WHERE id = p_request_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_id,
        emergency_request_id,
        details,
        created_at
    )
    VALUES (
        v_caller_id,
        'EMERGENCY_ACCESS_APPROVED',
        v_req.resource_id,
        p_request_id,
        jsonb_build_object(
            'target_user_id', v_req.user_id,
            'duration_minutes', v_req.requested_duration,
            'expires_at', v_expires_at
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'request_id', p_request_id,
        'status', 'approved',
        'expires_at', v_expires_at
    );
END;
$$;

-- 7.3 REJECT EMERGENCY ACCESS
CREATE OR REPLACE FUNCTION public.reject_emergency_access(
    p_request_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
    v_req RECORD;
BEGIN
    -- Caller authentication
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Role verification
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role NOT IN ('operator', 'admin') THEN
        RAISE EXCEPTION 'Not authorized: Only operators and administrators can reject emergency requests.';
    END IF;

    -- Validation
    IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
        RAISE EXCEPTION 'A valid rejection reason is required.';
    END IF;

    SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Request cannot be rejected because status is %.', v_req.status;
    END IF;

    -- Update request
    UPDATE public.emergency_requests
    SET status = 'rejected',
        rejected_at = NOW(),
        rejected_by = v_caller_id,
        rejection_reason = trim(p_reason)
    WHERE id = p_request_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_id,
        emergency_request_id,
        details,
        created_at
    )
    VALUES (
        v_caller_id,
        'EMERGENCY_ACCESS_REJECTED',
        v_req.resource_id,
        p_request_id,
        jsonb_build_object(
            'target_user_id', v_req.user_id,
            'reason', trim(p_reason)
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'request_id', p_request_id,
        'status', 'rejected'
    );
END;
$$;

-- 7.4 REVOKE EMERGENCY ACCESS
CREATE OR REPLACE FUNCTION public.revoke_emergency_access(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT;
    v_req RECORD;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    IF v_req.status != 'approved' THEN
        RAISE EXCEPTION 'Cannot revoke session with status %.', v_req.status;
    END IF;

    -- Only the requesting user themselves OR an operator/admin can revoke
    IF v_req.user_id != v_caller_id AND v_caller_role NOT IN ('operator', 'admin') THEN
        RAISE EXCEPTION 'Not authorized: You can only revoke your own active session.';
    END IF;

    UPDATE public.emergency_requests
    SET status = 'revoked',
        revoked_at = NOW(),
        revoked_by = v_caller_id
    WHERE id = p_request_id;

    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_id,
        emergency_request_id,
        details,
        created_at
    )
    VALUES (
        v_caller_id,
        'EMERGENCY_ACCESS_REVOKED',
        v_req.resource_id,
        p_request_id,
        jsonb_build_object(
            'target_user_id', v_req.user_id,
            'revoked_by_role', v_caller_role
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'request_id', p_request_id,
        'status', 'revoked'
    );
END;
$$;

-- 7.5 AUTOMATIC EXPIRATION
CREATE OR REPLACE FUNCTION public.expire_emergency_access()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_record IN
        SELECT id, user_id, resource_id, expires_at
        FROM public.emergency_requests
        WHERE status = 'approved' AND expires_at <= NOW()
        FOR UPDATE
    LOOP
        UPDATE public.emergency_requests
        SET status = 'expired'
        WHERE id = v_record.id;

        INSERT INTO public.audit_logs (
            user_id,
            action,
            resource_id,
            emergency_request_id,
            details,
            created_at
        )
        VALUES (
            v_record.user_id,
            'EMERGENCY_ACCESS_EXPIRED',
            v_record.resource_id,
            v_record.id,
            jsonb_build_object('expired_at', NOW()),
            NOW()
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 8. DEMO SEED DATA (Protected Resources)
INSERT INTO public.protected_resources (name, description, sensitivity_level)
VALUES 
    (
        'Patient Health Records (EMR/EHR)',
        'Protected Health Information (PHI), patient medical charts, clinical vitals, prescription history, and emergency care logs.',
        'critical'
    ),
    (
        'Financial & Payroll Ledger',
        'Direct core banking ledger integration, wire transfer authorizations, payroll records, and executive compensation accounts.',
        'critical'
    ),
    (
        'Confidential Documents Vault',
        'Proprietary cryptographic keys, board meeting minutes, corporate M&A data room documents, and source-code intellectual property.',
        'high'
    )
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    sensitivity_level = EXCLUDED.sensitivity_level;
