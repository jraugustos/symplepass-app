-- Migration: Auth Improvements
-- Description: Makes CPF optional, adds auth fields, auto-creates profiles for new users

-- 1. Make CPF optional in profiles table
ALTER TABLE profiles ALTER COLUMN cpf DROP NOT NULL;

-- 2. Add auth-related fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- 3. Create function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to call function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Add INSERT policy for profiles (allow users to create their own profile)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Add index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 7. Add comment explaining CPF is now optional
COMMENT ON COLUMN profiles.cpf IS 'CPF is optional to allow quick signup without CPF during checkout';
