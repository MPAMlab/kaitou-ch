CREATE TABLE IF NOT EXISTS kaitou_ch_vote (
    option_name TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
);

-- Initialize rows if they don't exist
INSERT OR IGNORE INTO kaitou_ch_vote (option_name, count) VALUES ('Yes', 0);
INSERT OR IGNORE INTO kaitou_ch_vote (option_name, count) VALUES ('No', 0);
