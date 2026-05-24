import os
import re

def global_replace():
    frontend_dir = r"d:\Student LMS\frontend"
    
    # Files/folders to exclude completely
    exclude_dirs = {".next", "node_modules", ".git", "public"}
    text_extensions = {".tsx", ".ts", ".json", ".css", ".md", ".mjs", ".html", "example", "local"}
    
    replacements = [
        (re.compile(r"TenspickLMS", re.IGNORECASE), "StudentLMS"),
        (re.compile(r"Tenspick\s+LMS", re.IGNORECASE), "Student LMS"),
        (re.compile(r"Tenspick", re.IGNORECASE), "Student"),
        (re.compile(r"tenspick", re.IGNORECASE), "student")
    ]
    
    modified_count = 0
    
    for root, dirs, files in os.walk(frontend_dir):
        # Exclude directories in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            file_ext = os.path.splitext(file)[1].lower()
            # Also match files like .env.local, .env.example
            is_env = "env" in file.lower()
            
            if file_ext in text_extensions or is_env:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        original_content = f.read()
                        
                    content = original_content
                    # Apply replacements
                    has_change = False
                    for pattern, repl in replacements:
                        if pattern.search(content):
                            content = pattern.sub(repl, content)
                            has_change = True
                            
                    if has_change and content != original_content:
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        print(f"Replaced brand in: {file_path}")
                        modified_count += 1
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    
    print(f"Global brand name replacement complete. Modified {modified_count} files.")

if __name__ == "__main__":
    global_replace()
