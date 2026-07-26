import {createSlice} from '@reduxjs/toolkit'
import {loadStoredSettings} from '../../../services/settingsStorage.js'

const settingsSlice = createSlice({
    name: 'settings',
    initialState: loadStoredSettings(),
    reducers: {
        setDesktopNotifications(state, action) {
            state.desktopNotifications = action.payload
        },
        setSoundEnabled(state, action) {
            state.soundEnabled = action.payload
        },
        setEnterToSend(state, action) {
            state.enterToSend = action.payload
        },
        setTheme(state, action) {
            state.theme = action.payload
        },
    },
})

export const {
    setDesktopNotifications,
    setSoundEnabled,
    setEnterToSend,
    setTheme,
} = settingsSlice.actions
export default settingsSlice.reducer
