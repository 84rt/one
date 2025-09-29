    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create custom types
    CREATE TYPE user_role AS ENUM ('admin', 'member');

    -- Habits table
    CREATE TABLE habits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#3B82F6',
        icon TEXT NOT NULL DEFAULT 'check-circle',
        target_frequency INTEGER NOT NULL DEFAULT 7, -- days per week
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Habit completions table
    CREATE TABLE habit_completions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Habit groups table
    CREATE TABLE habit_groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Group members table
    CREATE TABLE group_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID NOT NULL REFERENCES habit_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role user_role NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(group_id, user_id)
    );

    -- Group habits table (linking habits to groups)
    CREATE TABLE group_habits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID NOT NULL REFERENCES habit_groups(id) ON DELETE CASCADE,
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(group_id, habit_id)
    );

    -- Create indexes for better performance
    CREATE INDEX idx_habits_user_id ON habits(user_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_habits_updated_at ON habits(updated_at) WHERE deleted_at IS NULL;
    CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at) WHERE deleted_at IS NULL;
    CREATE INDEX idx_group_members_group_id ON group_members(group_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_group_members_user_id ON group_members(user_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_group_habits_group_id ON group_habits(group_id) WHERE deleted_at IS NULL;
    CREATE INDEX idx_group_habits_habit_id ON group_habits(habit_id) WHERE deleted_at IS NULL;

    -- Unique index to ensure one completion per day per habit per user
    CREATE UNIQUE INDEX idx_habit_completions_unique_daily ON habit_completions(habit_id, user_id, ((completed_at AT TIME ZONE 'UTC')::date)) WHERE deleted_at IS NULL;

    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create triggers for updated_at
    CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON habit_completions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_habit_groups_updated_at BEFORE UPDATE ON habit_groups
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON group_members
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_group_habits_updated_at BEFORE UPDATE ON group_habits
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Row Level Security (RLS) policies
    ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE habit_groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE group_habits ENABLE ROW LEVEL SECURITY;

    -- Habits policies
    CREATE POLICY "Users can view their own habits" ON habits
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own habits" ON habits
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own habits" ON habits
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own habits" ON habits
        FOR DELETE USING (auth.uid() = user_id);

    -- Habit completions policies
    CREATE POLICY "Users can view their own habit completions" ON habit_completions
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own habit completions" ON habit_completions
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own habit completions" ON habit_completions
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own habit completions" ON habit_completions
        FOR DELETE USING (auth.uid() = user_id);

    -- Group members can view habit completions of other members
    CREATE POLICY "Group members can view group habit completions" ON habit_completions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM group_habits gh
                JOIN group_members gm ON gh.group_id = gm.group_id
                WHERE gh.habit_id = habit_completions.habit_id
                AND gm.user_id = auth.uid()
                AND gm.deleted_at IS NULL
            )
        );

    -- Habit groups policies
    CREATE POLICY "Users can view groups they belong to" ON habit_groups
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_id = habit_groups.id
                AND user_id = auth.uid()
                AND deleted_at IS NULL
            )
        );

    CREATE POLICY "Users can create habit groups" ON habit_groups
        FOR INSERT WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Group admins can update groups" ON habit_groups
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_id = habit_groups.id
                AND user_id = auth.uid()
                AND role = 'admin'
                AND deleted_at IS NULL
            )
        );

    -- Group members policies
    CREATE POLICY "Users can view group members of their groups" ON group_members
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM group_members gm
                WHERE gm.group_id = group_members.group_id
                AND gm.user_id = auth.uid()
                AND gm.deleted_at IS NULL
            )
        );

    CREATE POLICY "Group admins can manage members" ON group_members
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM group_members gm
                WHERE gm.group_id = group_members.group_id
                AND gm.user_id = auth.uid()
                AND gm.role = 'admin'
                AND gm.deleted_at IS NULL
            )
        );

    -- Group habits policies
    CREATE POLICY "Group members can view group habits" ON group_habits
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_id = group_habits.group_id
                AND user_id = auth.uid()
                AND deleted_at IS NULL
            )
        );

    CREATE POLICY "Group admins can manage group habits" ON group_habits
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM group_members
                WHERE group_id = group_habits.group_id
                AND user_id = auth.uid()
                AND role = 'admin'
                AND deleted_at IS NULL
            )
        );

    -- Create a function to calculate habit streaks
    CREATE OR REPLACE FUNCTION calculate_habit_streak(habit_uuid UUID, user_uuid UUID)
    RETURNS INTEGER AS $$
    DECLARE
        streak_count INTEGER := 0;
        streak_date DATE := CURRENT_DATE;
        completion_exists BOOLEAN;
    BEGIN
        -- Check if there's a completion for today
        SELECT EXISTS(
            SELECT 1 FROM habit_completions 
            WHERE habit_id = habit_uuid 
            AND user_id = user_uuid 
            AND completed_at::date = streak_date
            AND deleted_at IS NULL
        ) INTO completion_exists;
        
        -- If no completion today, start from yesterday
        IF NOT completion_exists THEN
            streak_date := streak_date - 1;
        END IF;
        
        -- Count consecutive days with completions
        WHILE TRUE LOOP
            SELECT EXISTS(
                SELECT 1 FROM habit_completions 
                WHERE habit_id = habit_uuid 
                AND user_id = user_uuid 
                AND completed_at::date = streak_date
                AND deleted_at IS NULL
            ) INTO completion_exists;
            
            IF NOT completion_exists THEN
                EXIT;
            END IF;
            
            streak_count := streak_count + 1;
            streak_date := streak_date - 1;
        END LOOP;
        
        RETURN streak_count;
    END;
    $$ LANGUAGE plpgsql;
