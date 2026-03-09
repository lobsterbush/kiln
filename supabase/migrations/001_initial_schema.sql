-- Kiln: AI-Resistant Active Learning Platform
-- Initial database schema

-- Activities (reusable templates)
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'peer_critique', 'socratic_chain', 'evidence_eval', 'concept_synthesis'
  )),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions (live instances)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'lobby' CHECK (status IN (
    'lobby', 'active', 'between_rounds', 'completed'
  )),
  current_round INT DEFAULT 0,
  round_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants (students, no auth required)
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Responses
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) NOT NULL,
  round INT NOT NULL,
  content TEXT NOT NULL,
  response_type TEXT DEFAULT 'initial' CHECK (response_type IN (
    'initial', 'critique', 'rebuttal', 'followup_answer'
  )),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  time_taken_ms INT
);

-- Peer Assignments
CREATE TABLE peer_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  round INT NOT NULL,
  reviewer_id UUID REFERENCES participants(id) NOT NULL,
  author_id UUID REFERENCES participants(id) NOT NULL,
  response_id UUID REFERENCES responses(id) NOT NULL
);

-- AI Follow-ups (Socratic Chains)
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) NOT NULL,
  round INT NOT NULL,
  prompt TEXT NOT NULL,
  based_on_response_id UUID REFERENCES responses(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Materials (uploaded content)
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for participant and response tables
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;

-- Indexes
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_token ON participants(token);
CREATE INDEX idx_responses_session_round ON responses(session_id, round);
CREATE INDEX idx_peer_assignments_session_round ON peer_assignments(session_id, round);
CREATE INDEX idx_follow_ups_session_participant ON follow_ups(session_id, participant_id);

-- Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Activities: instructors can CRUD their own
CREATE POLICY "Instructors manage own activities"
  ON activities FOR ALL
  USING (auth.uid() = instructor_id);

-- Sessions: instructors manage, anyone can read by join code
CREATE POLICY "Instructors manage own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = instructor_id);

CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT
  USING (true);

-- Participants: anyone can insert (join), read within session
CREATE POLICY "Anyone can join a session"
  ON participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read participants in a session"
  ON participants FOR SELECT
  USING (true);

-- Responses: participants can insert, anyone in session can read
CREATE POLICY "Participants can submit responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read responses"
  ON responses FOR SELECT
  USING (true);

-- Peer assignments: managed by system, readable by all
CREATE POLICY "Anyone can read peer assignments"
  ON peer_assignments FOR SELECT
  USING (true);

CREATE POLICY "System can create peer assignments"
  ON peer_assignments FOR INSERT
  WITH CHECK (true);

-- Follow-ups: managed by system, readable by all
CREATE POLICY "Anyone can read follow-ups"
  ON follow_ups FOR SELECT
  USING (true);

CREATE POLICY "System can create follow-ups"
  ON follow_ups FOR INSERT
  WITH CHECK (true);

-- Materials: instructors manage their own
CREATE POLICY "Instructors manage own materials"
  ON materials FOR ALL
  USING (auth.uid() = instructor_id);
