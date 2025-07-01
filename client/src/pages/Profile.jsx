import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Person,
  Description,
  People,
  CalendarToday,
  Save,
  Edit,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
  })

  // Fetch user profile data
  const { data: profileData, isLoading } = useQuery(
    ['userProfile', user?.id],
    async () => {
      const response = await axios.get(`/api/users/${user.id}`)
      return response.data.data
    },
    { enabled: !!user }
  )

  // Fetch user's documents
  const { data: userDocuments } = useQuery(
    ['userDocuments', user?.id],
    async () => {
      const response = await axios.get(`/api/users/${user.id}/documents?limit=5`)
      return response.data.data
    },
    { enabled: !!user }
  )

  // Fetch user's collaborations
  const { data: userCollaborations } = useQuery(
    ['userCollaborations', user?.id],
    async () => {
      const response = await axios.get(`/api/users/${user.id}/collaborations?limit=5`)
      return response.data.data
    },
    { enabled: !!user }
  )

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      name: user?.name || '',
      avatar: user?.avatar || '',
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: user?.name || '',
      avatar: user?.avatar || '',
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    const result = await updateProfile(formData)
    if (result.success) {
      setIsEditing(false)
      queryClient.invalidateQueries(['userProfile', user?.id])
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

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
        <Typography variant="h4">Profile</Typography>
        {!isEditing ? (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '3rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={formData.avatar}
                  onChange={(e) => handleChange('avatar', e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="h5" gutterBottom>
                  {user?.name}
                </Typography>
              )}
              {isEditing ? (
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  size="small"
                />
              ) : (
                <Typography variant="body1" color="textSecondary">
                  {user?.email}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Role:
                </Typography>
                <Chip label={user?.role} size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Email Verified:
                </Typography>
                <Chip
                  label={user?.isEmailVerified ? 'Yes' : 'No'}
                  color={user?.isEmailVerified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Description />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div">
                        {profileData?.stats?.documentsCount || 0}
                      </Typography>
                      <Typography color="textSecondary">Total Documents</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div">
                        {profileData?.stats?.publicDocumentsCount || 0}
                      </Typography>
                      <Typography color="textSecondary">Public Documents</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <People />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div">
                        {userCollaborations?.data?.length || 0}
                      </Typography>
                      <Typography color="textSecondary">Collaborations</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Documents */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Documents
                </Typography>
                {userDocuments?.data?.length > 0 ? (
                  <List dense>
                    {userDocuments.data.map((doc, index) => (
                      <React.Fragment key={doc._id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <Description />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={doc.title}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={doc.status}
                                  size="small"
                                  color={doc.status === 'published' ? 'success' : 'warning'}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < userDocuments.data.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No documents yet
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Recent Collaborations */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Collaborations
                </Typography>
                {userCollaborations?.data?.length > 0 ? (
                  <List dense>
                    {userCollaborations.data.map((doc, index) => (
                      <React.Fragment key={doc._id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <Description />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={doc.title}
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                  by {doc.author?.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < userCollaborations.data.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No collaborations yet
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Profile 