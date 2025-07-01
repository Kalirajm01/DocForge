import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  InputAdornment,
  Pagination,
  CircularProgress,
  Divider,
} from '@mui/material'
import {
  Search,
  Description,
  Person,
  Visibility,
  People,
  CalendarToday,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'

const SearchPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery(
    ['search', query, activeTab, page],
    async () => {
      if (!query.trim()) return null
      
      const searchType = activeTab === 0 ? 'documents' : 'users'
      const params = new URLSearchParams({
        q: query,
        page,
        limit: 10,
      })
      
      const response = await axios.get(`/api/search/${searchType}?${params}`)
      return response.data
    },
    { enabled: !!query.trim() }
  )

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setPage(1)
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setPage(1)
  }

  const handlePageChange = (event, value) => {
    setPage(value)
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

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>

      {/* Search Form */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search documents, users, or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!query.trim()}
                >
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Search Results */}
      {query.trim() && (
        <>
          {/* Tabs */}
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab
              icon={<Description />}
              label={`Documents (${data?.pagination?.total || 0})`}
            />
            <Tab
              icon={<Person />}
              label={`Users (${data?.pagination?.total || 0})`}
            />
          </Tabs>

          {/* Results */}
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">Error performing search</Typography>
          ) : data?.data?.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No results found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your search terms
              </Typography>
            </Box>
          ) : (
            <>
              {/* Documents Tab */}
              {activeTab === 0 && data?.data && (
                <List>
                  {data.data.map((doc, index) => (
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
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  {doc.author?.name}
                                </Typography>
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
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < data.data.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}

              {/* Users Tab */}
              {activeTab === 1 && data?.data && (
                <List>
                  {data.data.map((user, index) => (
                    <React.Fragment key={user._id}>
                      <ListItem
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/users/${user._id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            {user.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={user.email}
                        />
                      </ListItem>
                      {index < data.data.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}

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
            </>
          )}
        </>
      )}

      {/* Search Tips */}
      {!query.trim() && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Tips
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            • Search for document titles, content, or user names
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            • Use specific keywords for better results
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            • Switch between Documents and Users tabs to filter results
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default SearchPage 