// Password hashing utilities
// Note: In production, use bcryptjs or similar library
// For now, we'll use a simple hash function (NOT SECURE - replace with bcrypt in production)

export const hashPassword = async (password: string): Promise<string> => {
  // Simple hash function - REPLACE WITH BCRYPT IN PRODUCTION
  // For now, we'll use a basic implementation
  // In production: import bcrypt from 'bcryptjs'; return bcrypt.hash(password, 10);
  
  // This is a placeholder - you should install bcryptjs: npm install bcryptjs @types/bcryptjs
  // Then use: return bcrypt.hash(password, 10);
  
  // Temporary simple hash (NOT SECURE - for development only)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  // Simple verification - REPLACE WITH BCRYPT IN PRODUCTION
  // In production: import bcrypt from 'bcryptjs'; return bcrypt.compare(password, hash);
  
  // Temporary simple verification (NOT SECURE - for development only)
  // Handle both plain text (for backward compatibility) and hashed passwords
  
  // If hash is short (likely plain text), do direct comparison
  if (hash.length < 40) {
    return password === hash;
  }
  
  // For hashed passwords, compute hash and compare
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

