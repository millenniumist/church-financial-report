/**
 * Cloudinary Mock
 * Mock Cloudinary SDK for testing image uploads
 */

const mockUploadStream = jest.fn((options, callback) => {
  const stream = {
    end: jest.fn((buffer) => {
      // Simulate successful upload
      callback(null, {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
        public_id: 'test-image-id',
        width: 800,
        height: 600,
        format: 'jpg',
        resource_type: 'image',
        created_at: new Date().toISOString(),
        bytes: buffer?.length || 1024,
      });
    }),
  };
  return stream;
});

export const mockCloudinary = {
  config: jest.fn(),
  uploader: {
    upload: jest.fn(() =>
      Promise.resolve({
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
        public_id: 'test-image-id',
        width: 800,
        height: 600,
        format: 'jpg',
      })
    ),
    upload_stream: mockUploadStream,
    destroy: jest.fn(() =>
      Promise.resolve({
        result: 'ok',
      })
    ),
  },
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(() =>
        Promise.resolve({
          secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test.jpg',
          public_id: 'test-image-id',
        })
      ),
      upload_stream: mockUploadStream,
      destroy: jest.fn(() =>
        Promise.resolve({
          result: 'ok',
        })
      ),
    },
  },
};

// Mock the cloudinary module
jest.mock('cloudinary', () => mockCloudinary);

export default mockCloudinary;
