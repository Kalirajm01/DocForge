import React, { useState } from 'react'
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Visibility,
  People,
  Person,
  CalendarToday,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'

const DocumentList = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [privacyFilter, setPrivacyFilter] = useState('')

  const { data, isLoading, error } = useQuery(
    ['documents', page, search, statusFilter, privacyFilter],
    async () => {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(privacyFilter && { privacy: privacyFilter }),
      })
      const response = await axios.get(`/api/documents?${params}`)
      return response.data
    }
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

  const handlePageChange = (event, value) => {
    setPage(value)
  }

  const handleSearch = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const handlePrivacyFilter = (event) => {
    setPrivacyFilter(event.target.value)
    setPage(1)
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography color="error">Error loading documents</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Documents</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/documents/new')}
        >
          New Document
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Privacy</InputLabel>
              <Select
                value={privacyFilter}
                label="Privacy"
                onChange={handlePrivacyFilter}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Documents Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.data?.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {doc.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        <Person />
                      </Avatar>
                      <Typography variant="body2" color="textSecondary">
                        {doc.author?.name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </Typography>
                    </Box>

                    {doc.tags && doc.tags.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {doc.tags.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {doc.tags.length > 3 && (
                          <Chip
                            label={`+${doc.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/documents/${doc._id}/edit`)
                      }}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={data.pagination.pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}

          {/* No documents message */}
          {data?.data?.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No documents found
              </Typography>
              <Typography color="textSecondary">
                {search || statusFilter || privacyFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first document to get started'}
              </Typography>
              {!search && !statusFilter && !privacyFilter && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/documents/new')}
                  sx={{ mt: 2 }}
                >
                  Create Document
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default DocumentList 