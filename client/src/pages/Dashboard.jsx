import React from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  IconButton,
} from '@mui/material'
import {
  Add,
  Description,
  People,
  Visibility,
  Edit,
  CalendarToday,
  Person,
  Search,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Fetch recent documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery(
    'recentDocuments',
    async () => {
      const response = await axios.get('/api/documents?limit=5')
      return response.data
    }
  )

  // Fetch user stats
  const { data: userStats } = useQuery(
    'userStats',
    async () => {
      const response = await axios.get(`/api/users/${user.id}`)
      return response.data
    },
    { enabled: !!user }
  )

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Welcome back, {user?.name}!
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/documents/new')}
        >
          New Document
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Description />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {userStats?.data?.stats?.documentsCount || 0}
                  </Typography>
                  <Typography color="textSecondary">Total Documents</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Visibility />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {userStats?.data?.stats?.publicDocumentsCount || 0}
                  </Typography>
                  <Typography color="textSecondary">Public Documents</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {documentsData?.data?.filter(doc => doc.collaborators?.length > 0).length || 0}
                  </Typography>
                  <Typography color="textSecondary">Collaborations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="div">
                    {documentsData?.data?.filter(doc => doc.status === 'draft').length || 0}
                  </Typography>
                  <Typography color="textSecondary">Drafts</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Documents</Typography>
              <Button size="small" onClick={() => navigate('/documents')}>
                View All
              </Button>
            </Box>
            {documentsLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <List>
                {documentsData?.data?.map((doc, index) => (
                  <React.Fragment key={doc._id}>
                    <ListItem
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/documents/${doc._id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <Description />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={doc.title}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={doc.status}
                              size="small"
                              color={getStatusColor(doc.status)}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getPrivacyIcon(doc.privacy)}
                              <Typography variant="caption" color="textSecondary">
                                {doc.privacy}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/documents/${doc._id}/edit`)
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </ListItem>
                    {index < documentsData.data.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/documents/new')}
                fullWidth
              >
                Create New Document
              </Button>
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => navigate('/search')}
                fullWidth
              >
                Search Documents
              </Button>
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => navigate('/profile')}
                fullWidth
              >
                View Profile
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard 