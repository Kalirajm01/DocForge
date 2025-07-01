import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Link,
  Alert,
} from '@mui/material'
import { CheckCircle, Error } from '@mui/icons-material'
import axios from 'axios'

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const { verificationtoken } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/auth/verifyemail/${verificationtoken}`)
        setStatus('success')
        setMessage(response.data.message || 'Email verified successfully!')
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Email verification failed')
      }
    }

    if (verificationtoken) {
      verifyEmail()
    }
  }, [verificationtoken])

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography color="textSecondary">
              Please wait while we verify your email address.
            </Typography>
          </Box>
        )

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Email Verified!
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        )

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Verification Failed
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Go to Login
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/register"
            >
              Register Again
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Confluence Clone
          </Typography>
          {renderContent()}
        </Paper>
      </Box>
    </Container>
  )
}

export default VerifyEmail 