import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification as sendVerificationEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';

// Email validation regex for gmail.com addresses only
const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

// Password validation regex (minimum 8 characters, at least one uppercase, one lowercase, one number)
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZ40JYJ5p4lVEp9CE1vZ96nj59Zmaw16Y",
  authDomain: "farm-simulator-c75fe.firebaseapp.com",
  projectId: "farm-simulator-c75fe",
  storageBucket: "farm-simulator-c75fe.appspot.com",
  messagingSenderId: "154394360935",
  appId: "1:154394360935:web:972945f60cb94eaf9328c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, name) => {
  try {
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid Gmail address (@gmail.com)');
    }
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await sendVerificationEmail(userCredential.user);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Send Email Verification
export const sendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendVerificationEmail(user);
      return { error: null };
    }
    throw new Error('No user is currently signed in');
  } catch (error) {
    return { error: error.message };
  }
};

// Check Email Verification Status
export const checkEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.reload(); // Refresh the user object
      return user.emailVerified;
    }
    return false;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid Gmail address (@gmail.com)');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (!userCredential.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('Please verify your email address before signing in');
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure the email is a Gmail address
    if (!emailRegex.test(result.user.email)) {
      await firebaseSignOut(auth);
      throw new Error('Please use a Gmail account (@gmail.com)');
    }
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Facebook Sign In
export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    // Check if the associated email is a Gmail address
    if (!emailRegex.test(result.user.email)) {
      await firebaseSignOut(auth);
      throw new Error('Please use a Gmail account (@gmail.com)');
    }
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Password Reset
export const resetPassword = async (email) => {
  try {
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid Gmail address (@gmail.com)');
    }
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Sign Out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export { auth, emailRegex, passwordRegex };