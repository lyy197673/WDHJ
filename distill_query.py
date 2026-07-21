import sqlite3, json

conn = sqlite3.connect(r'C:\Users\30706\.local\share\mimocode\mimocode.db')
c = conn.cursor()

# Find repeated user text messages across sessions
c.execute('''
    SELECT text, count(distinct session_id) as sessions
    FROM (
        SELECT json_extract(p.data, '$.text') as text, p.session_id
        FROM part p
        JOIN message m ON m.id = p.message_id
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(p.data, '$.type') = 'text'
    )
    WHERE text IS NOT NULL AND length(text) > 2
    GROUP BY text
    HAVING sessions > 1
    ORDER BY sessions DESC
    LIMIT 30
''')
print("=== REPEATED USER REQUESTS ===")
for r in c.fetchall():
    print(f'{r[1]:>3} sessions  {r[0][:150]}')

print()

# Find repeated bash commands
c.execute('''
    SELECT cmd, count(*) as n
    FROM (
        SELECT json_extract(p.data, '$.state.input') as inp,
               json_extract(json_extract(p.data, '$.state.input'), '$.command') as cmd
        FROM part p
        JOIN message m ON m.id = p.message_id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND json_extract(p.data, '$.tool') = 'bash'
    )
    WHERE cmd IS NOT NULL
    GROUP BY cmd
    HAVING n > 2
    ORDER BY n DESC
    LIMIT 20
''')
print("=== REPEATED BASH COMMANDS ===")
for r in c.fetchall():
    print(f'{r[1]:>3}x  {r[0][:150]}')

print()

# Find repeated file edit targets
c.execute('''
    SELECT filepath, count(*) as n
    FROM (
        SELECT json_extract(json_extract(p.data, '$.state.input'), '$.file_path') as filepath
        FROM part p
        JOIN message m ON m.id = p.message_id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND json_extract(p.data, '$.tool') = 'Edit'
    )
    WHERE filepath IS NOT NULL
    GROUP BY filepath
    HAVING n > 3
    ORDER BY n DESC
    LIMIT 15
''')
print("=== MOST-EDITED FILES ===")
for r in c.fetchall():
    print(f'{r[1]:>3}x  {r[0]}')

conn.close()
