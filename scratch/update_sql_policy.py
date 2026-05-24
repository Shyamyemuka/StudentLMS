import re

def update_sql():
    sql_path = r"d:\Student LMS\backend\supabase_combined_setup.sql"
    
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()
        
    # 1. Replace the admin email with shyamyemukaofficial@gmail.com
    # Also find old student/tenspick admin emails
    sql = sql.replace("studentlmsofficial@gmail.com", "shyamyemukaofficial@gmail.com")
    sql = sql.replace("tenspicklmsofficial@gmail.com", "shyamyemukaofficial@gmail.com")
    
    # 2. Update subjects_select_all policy to TO public so anon users can fetch approved courses
    old_policy = 'CREATE POLICY "subjects_select_all"\nON subjects FOR SELECT\nTO authenticated'
    new_policy = 'CREATE POLICY "subjects_select_all"\nON subjects FOR SELECT\nTO public'
    
    if old_policy in sql:
        sql = sql.replace(old_policy, new_policy)
        print("Updated subjects_select_all to TO public successfully!")
    else:
        # Try a regex-based replacement to be safe
        pattern = re.compile(r'CREATE\s+POLICY\s+"subjects_select_all"\s+ON\s+subjects\s+FOR\s+SELECT\s+TO\s+authenticated', re.IGNORECASE)
        if pattern.search(sql):
            sql = pattern.sub('CREATE POLICY "subjects_select_all" ON subjects FOR SELECT TO public', sql)
            print("Regex: Updated subjects_select_all to TO public successfully!")
        else:
            print("Warning: CREATE POLICY subjects_select_all not found in standard formatting.")
            
    # Write back the SQL content
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(sql)
        
    print(f"Consolidated SQL updated successfully at: {sql_path}")

if __name__ == "__main__":
    update_sql()
