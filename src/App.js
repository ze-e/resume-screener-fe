import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Select, MenuItem, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Toastify from 'toastify-js'; 
import "toastify-js/src/toastify.css"; 

function App() {
    const [file, setFile] = useState(null);
    const [jobRole, setJobRole] = useState('');
    const [jobRoles, setJobRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [openRoleDialog, setOpenRoleDialog] = useState(false);
    const [newRole, setNewRole] = useState({
        role: '',
        skills: [{ name: '', synonyms: [''] }],
        experience_keywords: [''],
        education: '',
        weights: {
            skills: 0.4,
            experience: 0.4,
            education: 0.2
        }
    });
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const API_BASE_URL = (() => {
        const url = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        return url.split('#')[0].trim().replace(/\/$/, '');
    })();

    // Fetch job roles from the backend
    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const url = new URL('/api/roles', API_BASE_URL).toString();
                console.log('Fetching from URL:', url);
                const response = await fetch(url);
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setJobRoles(data);
            } catch (error) {
                console.error('Detailed error:', error);
                console.error('Error stack:', error.stack);
                console.error('Error fetching job roles:', error);
                console.error('Current API_BASE_URL:', API_BASE_URL);
            }
        };

        fetchJobRoles();
    }, [API_BASE_URL]);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleJobRoleChange = (event) => {
        setJobRole(event.target.value);
    };

    const handleSubmit = async () => {
        if (!file || !jobRole) {
            Toastify({
                text: "Please select a file and job role",
                duration: 3000, // Duration in milliseconds
                gravity: "top", // `top` or `bottom`
                position: 'right', // `left`, `center` or `right`
                backgroundColor: "#FF0000", // Custom background color
            }).showToast();
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('job_role', jobRole);

        try {
            console.log('Submitting form data:', {
                file: file.name,
                jobRole: jobRole
            });
            
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server response:', errorData);
                throw new Error(`Server error: ${errorData}`);
            }

            const data = await response.json();
            setResult(data); 
        } catch (error) {
            console.error('Detailed error:', error);
            Toastify({
                text: `Error uploading resume: ${error.message}`,
                duration: 3000,
                gravity: "top",
                position: 'right',
                backgroundColor: "#FF0000",
            }).showToast();
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = () => {
        setNewRole(prev => ({
            ...prev,
            skills: [...prev.skills, { name: '', synonyms: [''] }]
        }));
    };

    const handleAddKeyword = () => {
        setNewRole(prev => ({
            ...prev,
            experience_keywords: [...prev.experience_keywords, '']
        }));
    };

    // Function to create toast options
    const createToast = (text, backgroundColor) => {
        return {
            text: text,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: 'right', // `left`, `center` or `right`
            backgroundColor: backgroundColor,
        };
    };

    const handleSubmitNewRole = async () => {
        // Validate required fields
        if (!newRole.role || newRole.skills.length === 0 || newRole.experience_keywords.length === 0) {
            Toastify(createToast("Please fill in the required fields: Role Name, Skills, and Experience Keywords.", "#FF0000")).showToast(); 
            return; // Prevent submission if validation fails
        }

        setIsCreatingRole(true); // Set loading state to true when starting role creation
        try {
            const response = await fetch(`${API_BASE_URL}/api/roles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRole)
            });

            if (!response.ok) {
                throw new Error('Failed to create role');
            }

            // Refresh job roles list
            const updatedRoles = await fetch(`${API_BASE_URL}/api/roles`).then(res => res.json());
            setJobRoles(updatedRoles);
            setOpenRoleDialog(false);

            // Success notification
            Toastify(createToast("Role created successfully!", "#28a745")).showToast();  
        } catch (error) {
            console.error('Error creating role:', error);
            Toastify(createToast("Failed to create role.", "#FF0000")).showToast(); 
        } finally {
            setIsCreatingRole(false); // Reset loading state after role creation
        }
    };

    return (
        <Container maxWidth="sm" style={{ marginTop: '50px' }}>
            <Typography variant="h4" gutterBottom>
                Resume Screener
            </Typography>

            <input
                accept=".pdf,.docx"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
            />
            <label htmlFor="raised-button-file">
                <Button variant="contained" component="span">
                    Upload Resume
                </Button>
            </label>
            {file && <Typography variant="body1">{file.name}</Typography>}

            <Select
                value={jobRole}
                onChange={handleJobRoleChange}
                displayEmpty
                fullWidth
                style={{ marginTop: '20px' }}
            >
                <MenuItem value="" disabled>
                    Select Job Role
                </MenuItem>
                {jobRoles.map((role, index) => (
                    <MenuItem key={index} value={role}>
                        {role}
                    </MenuItem>
                ))}
            </Select>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <IconButton 
                    onClick={() => setOpenRoleDialog(true)}
                    style={{ marginBottom: '10px' }}
                >
                    <AddIcon /> Add New Role
                </IconButton>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                >
                    Submit
                </Button>
            </div>

            {loading && (
                <div style={{ marginTop: '20px' }}>
                    <CircularProgress />
                    <Typography variant="body1">Processing resume...</Typography>
                </div>
            )}

            {result && (
                <div style={{ marginTop: '20px' }}>
                    <Typography variant="h6">Results:</Typography>
                    <Typography variant="body1">Score without ChatGPT: {result.score_without_chatgpt}</Typography>
                    <Typography variant="body1">Score with ChatGPT: {result.score_with_chatgpt}</Typography>
                    <Typography variant="body1">ChatGPT Summary: {result.summary}</Typography>
                </div>
            )}

            <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Role Name"
                        value={newRole.role}
                        onChange={(e) => setNewRole(prev => ({ ...prev, role: e.target.value }))}
                        margin="normal"
                        required
                    />
                    
                    {newRole.skills.map((skill, index) => (
                        <div key={index}>
                            <TextField
                                fullWidth
                                required
                                label={`Skill ${index + 1}`}
                                value={skill.name}
                                onChange={(e) => {
                                    const updatedSkills = [...newRole.skills];
                                    updatedSkills[index].name = e.target.value;
                                    setNewRole(prev => ({ ...prev, skills: updatedSkills }));
                                }}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Synonyms (comma-separated)"
                                value={skill.synonyms.join(', ')}
                                onChange={(e) => {
                                    const updatedSkills = [...newRole.skills];
                                    updatedSkills[index].synonyms = e.target.value.split(',').map(s => s.trim());
                                    setNewRole(prev => ({ ...prev, skills: updatedSkills }));
                                }}
                                margin="normal"
                            />
                        </div>
                    ))}
                    <Button onClick={handleAddSkill}>Add Skill</Button>

                    {newRole.experience_keywords.map((keyword, index) => (
                        <TextField
                            key={index}
                            fullWidth
                            label={`Experience Keyword ${index + 1}`}
                            value={keyword}
                            onChange={(e) => {
                                const updatedKeywords = [...newRole.experience_keywords];
                                updatedKeywords[index] = e.target.value;
                                setNewRole(prev => ({ ...prev, experience_keywords: updatedKeywords }));
                            }}
                            margin="normal"
                        />
                    ))}
                    <Button onClick={handleAddKeyword}>Add Keyword</Button>

                    <TextField
                        fullWidth
                        label="Education"
                        value={newRole.education}
                        onChange={(e) => setNewRole(prev => ({ ...prev, education: e.target.value }))}
                        margin="normal"
                    />

                    <TextField
                        type="number"
                        label="Skills Weight"
                        value={newRole.weights.skills}
                        onChange={(e) => setNewRole(prev => ({ 
                            ...prev, 
                            weights: { ...prev.weights, skills: parseFloat(e.target.value) }
                        }))}
                        margin="normal"
                    />
                    <TextField
                        type="number"
                        label="Experience Weight"
                        value={newRole.weights.experience}
                        onChange={(e) => setNewRole(prev => ({ 
                            ...prev, 
                            weights: { ...prev.weights, experience: parseFloat(e.target.value) }
                        }))}
                        margin="normal"
                    />
                    <TextField
                        type="number"
                        label="Education Weight"
                        value={newRole.weights.education}
                        onChange={(e) => setNewRole(prev => ({ 
                            ...prev, 
                            weights: { ...prev.weights, education: parseFloat(e.target.value) }
                        }))}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSubmitNewRole} 
                        variant="contained" 
                        color="primary" 
                        disabled={isCreatingRole} // Disable button if creating role
                    >
                        {isCreatingRole ? 'Creating...' : 'Create Role'} {/* Change button text while loading */}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default App;
