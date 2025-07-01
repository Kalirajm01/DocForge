import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Autocomplete,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material'
import { Save, ArrowBack, Visibility, People } from '@mui/icons-material'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const DocumentEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    privacy: 'private',
    status: 'draft',
    tags: [],
  })
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null)

  // Fetch document if editing
  const { data: document, isLoading } = useQuery(
    ['document', id],
    async () => {
      const response = await axios.get(`/api/documents/${id}`)
      return response.data.data
    },
    { enabled: isEditing }
  )

  // Fetch users for @mentions
  const { data: users } = useQuery(
    'users',
    async () => {
      const response = await axios.get('/api/users/search?limit=50')
      return response.data.data
    }
  )

  // Set form data when document is loaded
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title,
        content: document.content,
        privacy: document.privacy,
        status: document.status,
        tags: document.tags || [],
      })
    }
  }, [document])

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    setAutoSaveStatus('saving')
    try {
      if (isEditing) {
        await axios.put(`/api/documents/${id}`, formData)
      } else {
        await axios.post('/api/documents', formData)
      }
      setAutoSaveStatus('saved')
    } catch (error) {
      setAutoSaveStatus('error')
      console.error('Auto-save error:', error)
    }
  }, [formData, isEditing, id])

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    if (formData.title.trim() && formData.content.trim()) {
      const timeout = setTimeout(autoSave, 2000)
      setAutoSaveTimeout(timeout)
      setAutoSaveStatus('pending')
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [formData.title, formData.content])

  // Save mutation
  const saveMutation = useMutation(
    async (data) => {
      if (isEditing) {
        return axios.put(`/api/documents/${id}`, data)
      } else {
        return axios.post('/api/documents', data)
      }
    },
    {
      onSuccess: (response) => {
        toast.success(isEditing ? 'Document updated successfully!' : 'Document created successfully!')
        queryClient.invalidateQueries(['document', id])
        queryClient.invalidateQueries('recentDocuments')
        if (!isEditing) {
          navigate(`/documents/${response.data.data._id}`)
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error saving document')
      },
    }
  )

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formData.content.trim()) {
      toast.error('Content is required')
      return
    }

    saveMutation.mutate(formData)
  }

  const getAutoSaveStatusText = () => {
    switch (autoSaveStatus) {
      case 'saved':
        return 'All changes saved'
      case 'saving':
        return 'Saving...'
      case 'pending':
        return 'Unsaved changes'
      case 'error':
        return 'Save failed'
      default:
        return ''
    }
  }

  const getAutoSaveStatusColor = () => {
    switch (autoSaveStatus) {
      case 'saved':
        return 'success'
      case 'saving':
        return 'info'
      case 'pending':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  // Quill modules and formats
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ]

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="h4">
            {isEditing ? 'Edit Document' : 'New Document'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={getAutoSaveStatusText()}
            color={getAutoSaveStatusColor()}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saveMutation.isLoading}
          >
            {saveMutation.isLoading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Title */}
        <TextField
          fullWidth
          label="Document Title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          sx={{ mb: 3 }}
          placeholder="Enter document title..."
        />

        {/* Privacy and Status */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Privacy</InputLabel>
            <Select
              value={formData.privacy}
              label="Privacy"
              onChange={(e) => handleChange('privacy', e.target.value)}
            >
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People />
                  Private
                </Box>
              </MenuItem>
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility />
                  Public
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tags */}
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={formData.tags}
          onChange={(event, newValue) => handleChange('tags', newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags..."
              sx={{ mb: 3 }}
            />
          )}
        />

        {/* Content Editor */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Content
          </Typography>
          <ReactQuill
            theme="snow"
            value={formData.content}
            onChange={(value) => handleChange('content', value)}
            modules={modules}
            formats={formats}
            placeholder="Start writing your document..."
            style={{ height: '400px', marginBottom: '50px' }}
          />
        </Box>

        {/* @mentions info */}
        <Alert severity="info" sx={{ mt: 2 }}>
          Use @ to mention users. Mentioned users will automatically get read access to this document.
        </Alert>
      </Paper>

      <Snackbar
        open={autoSaveStatus === 'error'}
        autoHideDuration={6000}
        onClose={() => setAutoSaveStatus('saved')}
      >
        <Alert severity="error" onClose={() => setAutoSaveStatus('saved')}>
          Auto-save failed. Please save manually.
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default DocumentEditor 