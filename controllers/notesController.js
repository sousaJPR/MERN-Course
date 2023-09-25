const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')


// @ Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler( async (req, res) => {
    // Get all notes from mongodb
    const notes =  await Note.find().lean()
    if (!notes?.length) {
        return res.status(400).json({message: 'No notes found'})
    }

    // Add username to each note before sending the response
    const notesWithUser = await Promise.all(notes.map (async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return {...note, username: user.username }
    }))
    res.json(notesWithUser)
})

// @ Create new note
// @route POST /notes
// @access Private

const createNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text ) {
        return res.status(400).json({message: 'All fields are required'})
    }

    // Check for duplicated titles
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate) {
        return res.status(409).json({message: 'This title already exists'})
    }

    // Create and store a new note
    const note = await Note.create({ user, title, text })

    if (note) { // Created 
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }
})

// @ Update note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async () => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({message: 'All fields are required.'})
    }

    // Confirm if note exists
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({message: 'Note not found.'})
    }

    // Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({message: 'Note title already exists.'})
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()
    res.json({message: `${updatedNote.title} updated `})
})

const deleteNote = asyncHandler(async () => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({message: 'Note ID required.'})
    }

    // Confirm if note exists
    const note = await Note.findById(id).exec()
    if (!note) {
        return res.status(400).json({message: 'Note not found'})
    }
    const result = await note.deleteOne()
    const reply = `Note ${result.title} with ID ${result.id} deleted`

    res.json(result)
})

module.exports = { getAllNotes, createNote, updateNote, deleteNote }