/**
 * Password Generation Utility
 * Generates secure passwords for admin-created student accounts
 */

/**
 * Generate a cryptographically secure random password
 * @param length - Length of the password (minimum 8, default 12)
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  // Minimum length check
  if (length < 8) {
    length = 8;
  }

  // Character sets (avoiding ambiguous characters like 0/O, 1/l/I)
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*-_=+";

  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each set
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Generate a username based on full name and student ID
 * @param fullName - Student's full name
 * @param studentId - Student's ID/Roll number
 * @returns A formatted username
 */
export function generateStudentUsername(
  fullName: string,
  studentId: string
): string {
  // Clean and process the name
  const nameParts = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);

  let username = "";

  if (nameParts.length === 1) {
    // Single name: use as is
    username = nameParts[0];
  } else if (nameParts.length === 2) {
    // First and last name: firstname.lastname
    username = `${nameParts[0]}.${nameParts[1]}`;
  } else {
    // Multiple names: first.middle.last or first.last
    username = `${nameParts[0]}.${nameParts[nameParts.length - 1]}`;
  }

  // Add student ID
  if (studentId) {
    username += `.${studentId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  }

  return username;
}

/**
 * Generate an email for a student if not provided
 * @param fullName - Student's full name
 * @param studentId - Student's ID/Roll number
 * @param domain - Institution email domain (default: StudentLMS.edu)
 * @returns Generated email address
 */
export function generateStudentEmail(
  fullName: string,
  studentId: string,
  domain: string = "StudentLMS.edu"
): string {
  const username = generateStudentUsername(fullName, studentId);
  return `${username}@${domain}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with strength score and feedback
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string;
  isStrong: boolean;
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Generate feedback
  if (password.length < 8) feedback.push("Password should be at least 8 characters");
  if (!/[a-z]/.test(password)) feedback.push("Add lowercase letters");
  if (!/[A-Z]/.test(password)) feedback.push("Add uppercase letters");
  if (!/[0-9]/.test(password)) feedback.push("Add numbers");
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push("Add special characters");

  // Determine strength
  let strengthText = "";
  if (score < 4) {
    strengthText = "Weak password. " + feedback.join(", ");
  } else if (score < 6) {
    strengthText = "Moderate password. Consider making it stronger.";
  } else {
    strengthText = "Strong password!";
  }

  return {
    score: Math.min(score, 7),
    feedback: strengthText,
    isStrong: score >= 6,
  };
}

/**
 * Format credential data for display/printing
 * @param credentials - Student credentials object
 * @returns Formatted string for display
 */
export interface StudentCredentials {
  fullName: string;
  email: string;
  password: string;
  studentId?: string;
  createdAt: string;
}

export function formatCredentialsForDisplay(
  credentials: StudentCredentials
): string {
  return `
╔═══════════════════════════════════════════════════╗
║        Student LMS - STUDENT CREDENTIALS         ║
╠═══════════════════════════════════════════════════╣
║ Name:     ${credentials.fullName.padEnd(39)} ║
║ Student ID: ${(credentials.studentId || "N/A").padEnd(37)} ║
║ Email:    ${credentials.email.padEnd(39)} ║
║ Password: ${credentials.password.padEnd(39)} ║
║ Created:  ${new Date(credentials.createdAt).toLocaleDateString().padEnd(39)} ║
╚═══════════════════════════════════════════════════╝

⚠️  IMPORTANT:
- Change your password after first login
- Keep your credentials secure
- Contact admin if you forget your password
`;
}
