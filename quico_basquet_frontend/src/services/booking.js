import { db } from './firebaseConfig'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

export const createBooking = async (bookingData) => {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    createdAt: new Date(),
    status: 'confirmed'
  })
  return docRef.id
}

export const getBookings = async (date) => {
  const dateStr = date.toISOString().split('T')[0]
  const q = query(
    collection(db, 'bookings'),
    where('date', '==', dateStr)
  )
  
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => doc.data())
}