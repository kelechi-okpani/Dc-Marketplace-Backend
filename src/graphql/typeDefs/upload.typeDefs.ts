import { gql } from 'graphql-tag';

export default gql`
  scalar Upload

  type UploadedFile {
    url: String!
    publicId: String!
  }

  extend type Mutation {
    uploadListingImages(files: [Upload!]!): [UploadedFile!]!
    uploadDocument(file: Upload!): UploadedFile!
    uploadAvatar(file: Upload!): UploadedFile!
  }
`;