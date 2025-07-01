import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Edit,
  History,
  People,
  Visibility,
  Add,
  Delete,
  Person,
  CalendarToday,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const DocumentView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showVersions, setShowVersions] = useState(false)
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [newCollaborator, setNewCollaborator] = useState({ email: '', permission: 'view' })

  // Fetch document
  const { data: document, isLoading, error } = useQuery(
    ['document', id],
    async () => {
      const response = await axios.get(`/api/documents/${id}`)
      return response.data.data
    }
  )

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation(
    async (data) => {
      return axios.post(`/api/documents/${id}/collaborators`, data)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', id])
        toast.success('Collaborator added successfully')
        setNewCollaborator({ email: '', permission: 'view' })
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error adding collaborator')
      },
    }
  )

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation(
    async (userId) => {
      return axios.delete(`/api/documents/${id}/collaborators/${userId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', id])
        toast.success('Collaborator removed successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error removing collaborator')
      },
    }
  )

  const handleAddCollaborator = () => {
    if (!newCollaborator.email) {
      toast.error('Email is required')
      return
    }
    addCollaboratorMutation.mutate(newCollaborator)
  }

  const handleRemoveCollaborator = (userId) => {
    removeCollaboratorMutation.mutate(userId)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'warning'
      case 'archived':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPrivacyIcon = (privacy) => {
    return privacy === 'public' ? <Visibility /> : <People />
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error">Error loading document</Alert>
      </Box>
    )
  }

  if (!document) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="warning">Document not found</Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {document.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={document.status}
              color={getStatusColor(document.status)}
              size="small"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getPrivacyIcon(document.privacy)}
              <Typography variant="body2" color="textSecondary">
                {document.privacy}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setShowVersions(true)}
          >
            Version History
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => setShowCollaborators(true)}
          >
            Collaborators
          </Button>
          {document.author?._id === user?.id && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/documents/${id}/edit`)}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* Document Info */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body1">
              {document.author?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
        </Box>
        
        {document.lastModifiedBy && document.lastModifiedBy._id !== document.author._id && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Last modified by {document.lastModifiedBy.name} {' '}
              {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
            </Typography>
          </Box>
        )}

        {document.tags && document.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {document.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Paper>

      {/* Document Content */}
      <Paper sx={{ p: 3 }}>
        <div dangerouslySetInnerHTML={{ __html: document.content }} />
      </Paper>

      {/* Mentions */}
      {document.mentions && document.mentions.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mentions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {document.mentions.map((mention, index) => (
              <Chip
                key={index}
                avatar={<Avatar>{mention.user.name.charAt(0)}</Avatar>}
                label={mention.user.name}
                size="small"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Version History Dialog */}
      <Dialog
        open={showVersions}
        onClose={() => setShowVersions(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          <List>
            {document.versions?.map((version, index) => (
              <ListItem key={version.versionNumber}>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Version ${version.versionNumber}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {version.createdBy.name} • {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </Typography>
                      {version.changeDescription && (
                        <Typography component="div" variant="body2" color="textSecondary">
                          {version.changeDescription}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVersions(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Collaborators Dialog */}
      <Dialog
        open={showCollaborators}
        onClose={() => setShowCollaborators(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Collaborators</DialogTitle>
        <DialogContent>
          {/* Add new collaborator */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Collaborator
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Email"
                value={newCollaborator.email}
                onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                size="small"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Permission</InputLabel>
                <Select
                  value={newCollaborator.permission}
                  label="Permission"
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, permission: e.target.value })}
                >
                  <MenuItem value="view">View</MenuItem>
                  <MenuItem value="edit">Edit</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAddCollaborator}
                disabled={addCollaboratorMutation.isLoading}
              >
                Add
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Current collaborators */}
          <Typography variant="h6" gutterBottom>
            Current Collaborators
          </Typography>
          <List>
            {document.permissions?.map((permission, index) => (
              <ListItem key={permission.user._id}>
                <ListItemAvatar>
                  <Avatar>
                    {permission.user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={permission.user.name}
                  secondary={`${permission.permission} permission • Added by ${permission.grantedBy.name}`}
                />
                {document.author?._id === user?.id && (
                  <IconButton
                    onClick={() => handleRemoveCollaborator(permission.user._id)}
                    disabled={removeCollaboratorMutation.isLoading}
                  >
                    <Delete />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCollaborators(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DocumentView 