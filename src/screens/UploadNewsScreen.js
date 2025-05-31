import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import userService from '../services/user.service';
import newsService from '../services/news.service';
import { useTheme } from '../hooks/useTheme';

const UploadNewsScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadType, setUploadType] = useState('url'); // 'url', 'text', 'file'
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [validUrl, setValidUrl] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Authentication Required',
            text2: 'You need to login first',
            position: 'top',
          });
          navigation.navigate('SignIn');
          return;
        }

        const userData = await userService.getMe(token);
        setUser({
          id: userData.user.id || '',
          name: userData.user.name,
          email: userData.user.email,
          role: userData.user.role,
        });
        setLoading(false);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to fetch user data',
          position: 'top',
        });
        navigation.navigate('SignIn');
      }
    };

    fetchUser();
  }, [navigation]);

  const validateUrl = (value) => {
    try {
      new URL(value);
      setValidUrl(true);
      return true;
    } catch (e) {
      setValidUrl(false);
      return false;
    }
  };

  const handleUrlChange = (value) => {
    setUrl(value);
    if (value) {
      validateUrl(value);
    } else {
      setValidUrl(true);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedFile = result.assets[0];
        
        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          Toast.show({
            type: 'error',
            text1: 'File Too Large',
            text2: 'Maximum file size is 5MB',
            position: 'top',
          });
          return;
        }

        setFile(selectedFile);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select file',
        position: 'top',
      });
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'txt':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  const handleSubmit = async () => {
    // Validate based on upload type
    if (uploadType === 'url' && (!url || !validateUrl(url))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid URL',
        text2: 'Please enter a valid URL',
        position: 'top',
      });
      return;
    } else if (uploadType === 'text' && !content) {
      Toast.show({
        type: 'error',
        text1: 'Missing Content',
        text2: 'Please enter some content',
        position: 'top',
      });
      return;
    } else if (uploadType === 'file' && !file) {
      Toast.show({
        type: 'error',
        text1: 'No File Selected',
        text2: 'Please upload a file',
        position: 'top',
      });
      return;
    }

    if (!title) {
      Toast.show({
        type: 'error',
        text1: 'Missing Title',
        text2: 'Please enter a title for your news',
        position: 'top',
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'You need to login first',
          position: 'top',
        });
        navigation.navigate('SignIn');
        return;
      }

      let response;

      if (uploadType === 'url') {
        response = await newsService.uploadNewsURL(token, {
          title: title,
          url: url
        });
      } else if (uploadType === 'text') {
        response = await newsService.uploadNewsContent(token, {
          title: title,
          content: content
        });
      } else if (uploadType === 'file' && file) {
        // For React Native, we'll use a different approach for file upload
        // Since multipart is problematic, let's use base64 encoding
        const fileData = {
          title: title,
          fileName: file.name,
          fileType: file.mimeType,
          fileUri: file.uri
        };
        
        response = await newsService.uploadNewsFile(token, fileData);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'News uploaded successfully! Processing...',
        position: 'top',
      });

      // Navigate to news detail or back to profile
      if (response && response.news && response.news.id) {
        navigation.navigate('NewsDetail', { newsId: response.news.id });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to upload news',
        position: 'top',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={darkMode ? '#6366f1' : '#4f46e5'} 
          />
          <Text style={[
            styles.loadingText,
            { color: darkMode ? '#ffffff' : '#64748b' }
          ]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#f8fafc', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Header */}
        <View style={[
          styles.header,
          { 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderBottomColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0',
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={darkMode ? '#ffffff' : '#6366f1'} 
            />
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            Upload News
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff' }
          ]}>
            <Ionicons 
              name="cloud-upload" 
              size={32} 
              color={darkMode ? '#a5b4fc' : '#6366f1'} 
            />
          </View>

          <Text style={[
            styles.title,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            Upload News Article
          </Text>
          <Text style={[
            styles.subtitle,
            { color: darkMode ? '#cbd5e1' : '#64748b' }
          ]}>
            Share news content for processing and knowledge graph generation
          </Text>

          {/* Info Box */}
          <View style={[
            styles.infoBox,
            { 
              backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff',
              borderColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
            }
          ]}>
            <Ionicons 
              name="information-circle" 
              size={20} 
              color={darkMode ? '#a5b4fc' : '#6366f1'} 
            />
            <Text style={[
              styles.infoText,
              { color: darkMode ? '#cbd5e1' : '#475569' }
            ]}>
              Our system will analyze your content, extract entities and relationships, 
              and generate a knowledge graph. Processing may take a few minutes.
            </Text>
          </View>

          {/* Upload Type Tabs */}
          <View style={[
            styles.tabContainer,
            { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9' }
          ]}>
            <TouchableOpacity
              style={[
                styles.tab, 
                uploadType === 'url' && styles.activeTab,
                uploadType === 'url' && {
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'white'
                }
              ]}
              onPress={() => setUploadType('url')}
            >
              <Text style={[
                styles.tabText, 
                uploadType === 'url' && styles.activeTabText,
                { color: uploadType === 'url' 
                    ? darkMode ? '#a5b4fc' : '#6366f1'
                    : darkMode ? '#94a3b8' : '#64748b'
                }
              ]}>
                URL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                uploadType === 'text' && styles.activeTab,
                uploadType === 'text' && {
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'white'
                }
              ]}
              onPress={() => setUploadType('text')}
            >
              <Text style={[
                styles.tabText, 
                uploadType === 'text' && styles.activeTabText,
                { color: uploadType === 'text' 
                    ? darkMode ? '#a5b4fc' : '#6366f1'
                    : darkMode ? '#94a3b8' : '#64748b'
                }
              ]}>
                Text
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                uploadType === 'file' && styles.activeTab,
                uploadType === 'file' && {
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'white'
                }
              ]}
              onPress={() => setUploadType('file')}
            >
              <Text style={[
                styles.tabText, 
                uploadType === 'file' && styles.activeTabText,
                { color: uploadType === 'file' 
                    ? darkMode ? '#a5b4fc' : '#6366f1'
                    : darkMode ? '#94a3b8' : '#64748b'
                }
              ]}>
                File
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={[
              styles.label,
              { color: darkMode ? '#ffffff' : '#374151' }
            ]}>
              Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                  borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : '#d1d5db',
                  color: darkMode ? '#ffffff' : '#1f2937',
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title for this news article"
              placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
            />
          </View>

          {/* URL Input */}
          {uploadType === 'url' && (
            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#374151' }
              ]}>
                News Article URL *
              </Text>
              <View style={[
                styles.urlInputContainer,
                {
                  backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                  borderColor: !validUrl 
                    ? '#ef4444' 
                    : darkMode ? 'rgba(100, 116, 139, 0.5)' : '#d1d5db',
                }
              ]}>
                <Ionicons 
                  name="link" 
                  size={20} 
                  color={validUrl 
                    ? darkMode ? '#64748b' : '#94a3b8' 
                    : '#ef4444'
                  } 
                  style={styles.urlIcon} 
                />
                <TextInput
                  style={[
                    styles.urlInput,
                    { color: darkMode ? '#ffffff' : '#1f2937' }
                  ]}
                  value={url}
                  onChangeText={handleUrlChange}
                  placeholder="https://example.com/news-article"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!validUrl && (
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                )}
              </View>
              {!validUrl && (
                <Text style={styles.errorText}>Please enter a valid URL</Text>
              )}
            </View>
          )}

          {/* Text Input */}
          {uploadType === 'text' && (
            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#374151' }
              ]}>
                News Content *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : '#d1d5db',
                    color: darkMode ? '#ffffff' : '#1f2937',
                  }
                ]}
                value={content}
                onChangeText={setContent}
                placeholder="Paste or type the full news article content here"
                placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* File Upload */}
          {uploadType === 'file' && (
            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#374151' }
              ]}>
                Upload File *
              </Text>
              
              {!file ? (
                <TouchableOpacity 
                  style={[
                    styles.fileUploadArea,
                    {
                      backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                      borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : '#d1d5db',
                    }
                  ]} 
                  onPress={handleFileUpload}
                >
                  <Ionicons 
                    name="document-attach" 
                    size={32} 
                    color={darkMode ? '#64748b' : '#94a3b8'} 
                  />
                  <Text style={[
                    styles.fileUploadText,
                    { color: darkMode ? '#ffffff' : '#374151' }
                  ]}>
                    Click to upload a file
                  </Text>
                  <Text style={[
                    styles.fileUploadSubtext,
                    { color: darkMode ? '#94a3b8' : '#64748b' }
                  ]}>
                    PDF, DOCX, or TXT (max 5MB)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[
                  styles.fileContainer,
                  {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'white',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : '#d1d5db',
                  }
                ]}>
                  <View style={styles.fileInfo}>
                    <Ionicons 
                      name={getFileIcon(file.name)} 
                      size={24} 
                      color={darkMode ? '#a5b4fc' : '#6366f1'} 
                    />
                    <View style={styles.fileDetails}>
                      <Text style={[
                        styles.fileName,
                        { color: darkMode ? '#ffffff' : '#1f2937' }
                      ]}>
                        {file.name}
                      </Text>
                      <Text style={[
                        styles.fileSize,
                        { color: darkMode ? '#94a3b8' : '#64748b' }
                      ]}>
                        {file.mimeType || 'Unknown type'} • {Math.round(file.size / 1024)} KB
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={removeFile} 
                      style={[
                        styles.removeButton,
                        { backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.5)' : '#f1f5f9' }
                      ]}
                    >
                      <Ionicons 
                        name="close" 
                        size={20} 
                        color={darkMode ? '#cbd5e1' : '#64748b'} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.replaceButton,
                      { backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.5)' : '#f1f5f9' }
                    ]} 
                    onPress={handleFileUpload}
                  >
                    <Ionicons 
                      name="cloud-upload" 
                      size={16} 
                      color={darkMode ? '#cbd5e1' : '#64748b'} 
                    />
                    <Text style={[
                      styles.replaceButtonText,
                      { color: darkMode ? '#cbd5e1' : '#64748b' }
                    ]}>
                      Choose a different file
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' },
              (submitting || (uploadType === 'url' && !validUrl)) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={submitting || (uploadType === 'url' && !validUrl)}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="cloud-upload" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {submitting ? 'Processing...' : 'Upload & Process'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  urlIcon: {
    marginRight: 10,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 5,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 120,
  },
  fileUploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
  },
  fileUploadText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  fileUploadSubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  fileContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  replaceButtonText: {
    fontSize: 14,
    marginLeft: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UploadNewsScreen;