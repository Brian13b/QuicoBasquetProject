import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth'
import { auth, googleProvider } from './firebaseConfig'

const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

const loginWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
}

const register = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

const logout = () => {
  return signOut(auth)
}

export { 
  auth,
  googleProvider,
  loginWithEmail,
  loginWithGoogle,
  register,
  logout
}