-- About Plan initial schema (PostgreSQL)

create table if not exists users (
    tbl_user_id          varchar(64) primary key,
    str_name             varchar(120) not null,
    str_email            varchar(255) not null unique,
    str_password_hash    varchar(255) not null,
    dte_created_at       timestamptz not null default now(),
    dte_updated_at       timestamptz not null default now()
);

create table if not exists shared_calendars (
    tbl_shared_calendar_id   varchar(64) primary key,
    str_name                 varchar(120) not null,
    ref_created_by           varchar(64) not null references users(tbl_user_id) on delete restrict,
    dte_created_at           timestamptz not null default now(),
    dte_updated_at           timestamptz not null default now()
);

create table if not exists categories (
    tbl_category_id      varchar(64) primary key,
    str_name             varchar(120) not null,
    str_color            varchar(32) not null,
    opt_style            varchar(32) not null check (opt_style in ('dot', 'highlight')),
    ref_user_id          varchar(64) not null references users(tbl_user_id) on delete cascade,
    dte_created_at       timestamptz not null default now(),
    dte_updated_at       timestamptz not null default now(),
    unique (ref_user_id, str_name)
);

create table if not exists events (
    tbl_event_id             varchar(64) primary key,
    str_title                varchar(255) not null,
    dte_start_at             timestamptz not null,
    dte_end_at               timestamptz not null,
    ref_user_id              varchar(64) references users(tbl_user_id) on delete cascade,
    ref_shared_calendar_id   varchar(64) references shared_calendars(tbl_shared_calendar_id) on delete cascade,
    ref_category_id          varchar(64) references categories(tbl_category_id) on delete set null,
    bln_allow_overlap        boolean not null default false,
    opt_source_type          varchar(32) not null default 'manual' check (opt_source_type in ('manual', 'meeting', 'goal')),
    ref_source_id            varchar(64),
    dte_deleted_at           timestamptz null,
    dte_created_at           timestamptz not null default now(),
    dte_updated_at           timestamptz not null default now(),
    check (dte_end_at > dte_start_at),
    check ((ref_user_id is not null) <> (ref_shared_calendar_id is not null))
);

create table if not exists goals (
    tbl_goal_id              varchar(64) primary key,
    str_title                varchar(255) not null,
    str_description          text not null default '',
    dte_deadline             timestamptz not null,
    bln_is_completed         boolean not null default false,
    ref_user_id              varchar(64) references users(tbl_user_id) on delete cascade,
    ref_shared_calendar_id   varchar(64) references shared_calendars(tbl_shared_calendar_id) on delete cascade,
    dte_created_at           timestamptz not null default now(),
    dte_updated_at           timestamptz not null default now(),
    check ((ref_user_id is not null) <> (ref_shared_calendar_id is not null))
);

create table if not exists meeting_notes (
    tbl_meeting_note_id   varchar(64) primary key,
    str_title             varchar(255) not null,
    str_type              varchar(32) not null check (str_type in ('requirements', 'technical', 'testing', 'design', 'deployment', 'post_deployment', 'general')),
    str_content           text not null,
    ref_created_by        varchar(64) not null references users(tbl_user_id) on delete cascade,
    dte_created_at        timestamptz not null default now(),
    dte_updated_at        timestamptz not null default now()
);

create table if not exists meeting_events (
    ref_meeting_note_id   varchar(64) not null references meeting_notes(tbl_meeting_note_id) on delete cascade,
    ref_event_id          varchar(64) not null references events(tbl_event_id) on delete cascade,
    dte_created_at        timestamptz not null default now(),
    primary key (ref_meeting_note_id, ref_event_id)
);

create table if not exists board_posts (
    tbl_board_post_id     varchar(64) primary key,
    str_title             varchar(255) not null,
    str_content           text not null default '',
    ref_created_by        varchar(64) not null references users(tbl_user_id) on delete cascade,
    dte_created_at        timestamptz not null default now(),
    dte_updated_at        timestamptz not null default now()
);

create table if not exists board_items (
    tbl_board_item_id     varchar(64) primary key,
    str_content           text not null,
    ref_board_post_id     varchar(64) not null references board_posts(tbl_board_post_id) on delete cascade,
    ref_created_by        varchar(64) not null references users(tbl_user_id) on delete cascade,
    dte_created_at        timestamptz not null default now(),
    dte_updated_at        timestamptz not null default now()
);

create index if not exists idx_events_ref_user_id on events(ref_user_id);
create index if not exists idx_events_ref_shared_calendar_id on events(ref_shared_calendar_id);
create index if not exists idx_events_dte_start_at on events(dte_start_at);
create index if not exists idx_events_dte_end_at on events(dte_end_at);
create index if not exists idx_events_dte_deleted_at on events(dte_deleted_at);

create index if not exists idx_goals_ref_user_id on goals(ref_user_id);
create index if not exists idx_goals_ref_shared_calendar_id on goals(ref_shared_calendar_id);
create index if not exists idx_goals_dte_deadline on goals(dte_deadline);

create index if not exists idx_categories_ref_user_id on categories(ref_user_id);

create index if not exists idx_meeting_notes_ref_created_by on meeting_notes(ref_created_by);
create index if not exists idx_board_posts_ref_created_by on board_posts(ref_created_by);
create index if not exists idx_board_items_ref_board_post_id on board_items(ref_board_post_id);

-- Seed users/shared calendar to match current frontend defaults
insert into users (tbl_user_id, str_name, str_email, str_password_hash)
values
    ('user-a-001', 'User A', 'usera@aboutplan.com', 'password123'),
    ('user-b-002', 'User B', 'userb@aboutplan.com', 'password123')
on conflict (tbl_user_id) do nothing;

insert into shared_calendars (tbl_shared_calendar_id, str_name, ref_created_by)
values ('shared-cal-001', '공동 캘린더', 'user-a-001')
on conflict (tbl_shared_calendar_id) do nothing;
