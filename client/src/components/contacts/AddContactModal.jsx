import {useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {addContact, clearContactsError} from '../../state/features/contacts/contactsSlice'
import {Alert, Button, Modal, TextInput} from '../common/UI'

export default function AddContactModal({onClose, onAdded}) {
    const dispatch = useDispatch()
    const {status, error} = useSelector((state) => state.contacts)
    const [form, setForm] = useState({userId: '', name: ''})

    const update = (field) => (event) => {
        dispatch(clearContactsError())
        setForm((current) => ({...current, [field]: event.target.value}))
    }

    const submit = async (event) => {
        event.preventDefault()
        const result = await dispatch(addContact(form))

        if (addContact.fulfilled.match(result)) {
            onAdded?.(result.payload)
            onClose()
        }
    }

    return (
        <Modal title="Add a contact" onClose={onClose}>
            <form className="modal-form" onSubmit={submit}>
                <p className="modal-description">
                    The backend has no user-search endpoint. Enter the exact user ID and
                    CipherChat will verify that the account has uploaded a public key.
                </p>
                {error && <Alert>{error}</Alert>}
                <TextInput
                    label="Backend user ID"
                    value={form.userId}
                    onChange={update('userId')}
                    placeholder="e.g. cm123abc…"
                    required
                />
                <TextInput
                    label="Display name"
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Name shown on this device"
                    helper="This name is stored only in your browser."
                />
                <div className="modal-actions">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={status === 'saving'}>
                        Verify and add
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
