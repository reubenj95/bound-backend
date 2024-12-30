# Database Schema

## Tables

### Users
```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Events
```sql
events (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location VARCHAR(255),
  category_id UUID REFERENCES event_categories(id),
  user_id UUID REFERENCES users(id),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Check-ins
```sql
check_ins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  event_id UUID REFERENCES events(id),  -- Optional: only if associated with an event
  check_in_type VARCHAR(50) CHECK (check_in_type IN ('pre_event', 'post_event', 'general')),
  energy_rating INTEGER CHECK (energy_rating BETWEEN 1 AND 10),
  notes TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Feelings
```sql
feelings (
  id UUID PRIMARY KEY,
  word VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),  -- e.g., 'positive', 'negative', 'neutral'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Check-in Feelings
```sql
check_in_feelings (
  check_in_id UUID REFERENCES check_ins(id),
  feeling_id UUID REFERENCES feelings(id),
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),  -- Optional: track intensity of each feeling
  PRIMARY KEY (check_in_id, feeling_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Event Categories
```sql
event_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),  -- Hex color code
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### People
```sql
people (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  social_circle_id UUID REFERENCES social_circles(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Social Circles
```sql
social_circles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7),  -- Hex color code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Articles
```sql
articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  image_url VARCHAR(255),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Event Participants
```sql
event_participants (
  event_id UUID REFERENCES events(id),
  person_id UUID REFERENCES people(id),
  status VARCHAR(50) CHECK (status IN ('attending', 'declined', 'maybe', 'invited')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, person_id)
)
```

## Relationships

1. Check-ins -> Events (Optional Many-to-One)
   - Each check-in can optionally be associated with an event
   - Each event can have multiple check-ins (pre/post)

2. Check-ins -> Users (Many-to-One)
   - Each check-in belongs to one user
   - Each user can have multiple check-ins

3. Check-ins <-> Feelings (Many-to-Many)
   - Managed through check_in_feelings table
   - Each check-in can have multiple feelings
   - Each feeling can be associated with multiple check-ins

4. Events -> Event Categories (Many-to-One)
   - Each event belongs to one category
   - Each category can have multiple events

5. Events -> Users (Many-to-One)
   - Each event is created by one user
   - Each user can create multiple events

6. People -> Social Circles (Many-to-One)
   - Each person belongs to one social circle
   - Each social circle can have multiple people

7. Events <-> People (Many-to-Many)
   - Managed through event_participants table
   - Each event can have multiple participants
   - Each person can participate in multiple events

8. Articles -> Users (Many-to-One)
   - Each article is written by one user
   - Each user can write multiple articles

## Indexes

```sql
-- Check-ins
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_check_ins_event ON check_ins(event_id);
CREATE INDEX idx_check_ins_timestamp ON check_ins(timestamp);
CREATE INDEX idx_check_ins_type ON check_ins(check_in_type);

-- Check-in Feelings
CREATE INDEX idx_check_in_feelings_feeling ON check_in_feelings(feeling_id);

-- Feelings
CREATE INDEX idx_feelings_category ON feelings(category);

-- Events
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_start_date ON events(start_date);

-- People
CREATE INDEX idx_people_social_circle ON people(social_circle_id);
CREATE INDEX idx_people_name ON people(name);

-- Articles
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published_at ON articles(published_at);

-- Event Participants
CREATE INDEX idx_event_participants_person ON event_participants(person_id);
```

## Notes

1. UUID is used for primary keys to ensure uniqueness across different environments and for potential future data migration/merging.

2. All tables include created_at and updated_at timestamps for tracking record history.

3. Check-ins can be:
   - Pre-event: Capture state before an event
   - Post-event: Capture state after an event
   - General: Independent check-in not associated with any event

4. Feelings table serves as a controlled vocabulary, allowing for:
   - Consistent terminology
   - Categorization of feelings
   - Easy analysis and reporting

5. The intensity field in check_in_feelings allows users to indicate how strongly they feel each emotion.

6. Indexes are strategically placed to optimize:
   - Time-based queries (check-ins, events)
   - Relationship lookups
   - Category-based filtering

## Future Considerations

1. Add support for recurring events
2. Implement event reminders/notifications table
3. Add tags/categories for articles
4. Add support for event attachments/files
5. Implement user preferences/settings table
6. Add support for custom feeling words per user
7. Implement feeling word suggestions based on historical usage
8. Add mood tracking visualization support
9. Create aggregated views for energy level analysis
10. Add support for tracking correlations between activities/people and mood/energy
