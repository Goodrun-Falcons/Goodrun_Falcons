CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    username TEXT NOT NULL UNIQUE,

    role TEXT NOT NULL
        CHECK (role IN ('volunteer', 'organisation', 'admin')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY
        REFERENCES public.profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE public.organisations (
    id UUID PRIMARY KEY
        REFERENCES public.profiles(id)
        ON DELETE CASCADE
);