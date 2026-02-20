-- Add extensions to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS profile_link VARCHAR(255) UNIQUE;

-- Create index for profile_link for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_link ON user_profiles(profile_link);

-- Function to generate profile_link from username if not set
CREATE OR REPLACE FUNCTION generate_profile_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_link IS NULL OR NEW.profile_link = '' THEN
    NEW.profile_link := LOWER(REGEXP_REPLACE(NEW.username, '[^a-zA-Z0-9]', '', 'g')) || '-' || SUBSTRING(NEW.user_id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate profile_link
DROP TRIGGER IF EXISTS trigger_generate_profile_link ON user_profiles;
CREATE TRIGGER trigger_generate_profile_link
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_link();

-- Update existing profiles to have profile_link
UPDATE user_profiles
SET profile_link = LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9]', '', 'g')) || '-' || SUBSTRING(user_id::text, 1, 8)
WHERE profile_link IS NULL OR profile_link = '';
