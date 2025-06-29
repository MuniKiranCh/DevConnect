import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, MapPin, Globe, Github, Linkedin, Camera, Save, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Avatar } from '../components/UI';
import { useAuthStore } from '../utils/store';
import { profileAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { user: authUser, updateUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      reset(authUser);
    }
  }, [authUser, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await profileAPI.updateProfile(data);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your profile and settings</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <Edit className="h-4 w-4" />
              Cancel Edit
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar
                    src={user.photoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-32 h-32"
                  />
                  {isEditing && (
                    <div className="w-full">
                      <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Photo URL
                      </label>
                      <Input
                        id="photoUrl"
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        icon={Camera}
                        error={errors.photoUrl?.message}
                        {...register('photoUrl', {
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL',
                          },
                        })}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      icon={User}
                      disabled={!isEditing}
                      error={errors.firstName?.message}
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters',
                        },
                      })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      icon={User}
                      disabled={!isEditing}
                      error={errors.lastName?.message}
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters',
                        },
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    icon={User}
                    disabled={!isEditing}
                    error={errors.username?.message}
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores',
                      },
                    })}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    icon={Mail}
                    disabled={true}
                    value={user.email}
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'
                    }`}
                    placeholder="Tell us about yourself..."
                    {...register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio must be less than 500 characters',
                      },
                    })}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <Input
                    id="skills"
                    type="text"
                    disabled={!isEditing}
                    placeholder="JavaScript, React, Node.js, MongoDB"
                    error={errors.skills?.message}
                    {...register('skills', {
                      required: 'Please add at least one skill',
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Links */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Input
                    id="location"
                    type="text"
                    icon={MapPin}
                    disabled={!isEditing}
                    placeholder="City, Country"
                    error={errors.location?.message}
                    {...register('location')}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input
                    id="website"
                    type="url"
                    icon={Globe}
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                    error={errors.website?.message}
                    {...register('website', {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'Please enter a valid URL',
                      },
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <Input
                      id="github"
                      type="url"
                      icon={Github}
                      disabled={!isEditing}
                      placeholder="https://github.com/username"
                      error={errors.github?.message}
                      {...register('github', {
                        pattern: {
                          value: /^https?:\/\/github\.com\/.+/,
                          message: 'Please enter a valid GitHub profile URL',
                        },
                      })}
                    />
                  </div>
                  <div>
                    <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <Input
                      id="linkedin"
                      type="url"
                      icon={Linkedin}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/username"
                      error={errors.linkedin?.message}
                      {...register('linkedin', {
                        pattern: {
                          value: /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/,
                          message: 'Please enter a valid LinkedIn profile URL',
                        },
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile; 