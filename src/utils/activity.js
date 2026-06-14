import { doc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { getStoredKiwiUser } from "./kiwiUser"

export const appendUserActivity = async (field, value, extraUpdates = {}) => {
  const localUser = getStoredKiwiUser()
  const currentUser = auth.currentUser

  if (!localUser || !currentUser || currentUser.uid !== localUser.uid) {
    return false
  }

  const userRef = doc(db, "users", localUser.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    return false
  }

  const data = userSnap.data()

  await updateDoc(userRef, {
    [`activity.${field}`]: [...(data.activity?.[field] || []), value],
    ...extraUpdates
  })

  return true
}
