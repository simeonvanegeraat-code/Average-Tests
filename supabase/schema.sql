-- Quizzes (content can stay in code for MVP; DB is optional for analytics)
create table if not exists quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_slug text not null,
  score integer not null,
  max_score integer not null,
  created_at timestamp with time zone default now()
);

-- Polls (enable later)
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamp with time zone default now()
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  choice text check (choice in ('yes','no')),
  created_at timestamp with time zone default now()
);
