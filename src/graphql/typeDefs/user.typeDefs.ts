import { gql } from 'graphql-tag';

export default gql`
  type User {
    _id: ID!
    name: String!
    email: String
    phone: String
    role: String!
    avatar: String
    state: String
    city: String
    lga: String
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    isSellerVerified: Boolean!
    verificationBadge: String!
    isDCMember: Boolean!
    dcMemberVerified: Boolean!
    dcState: String
    dcChurch: String
    status: String!
    totalListings: Int!
    activeListings: Int!
    reportCount: Int!
    isFlagged: Boolean!
    lastLogin: String
    createdAt: String!
  }

  type PublicProfile {
    _id: ID!
    name: String!
    avatar: String
    state: String
    city: String
    isSellerVerified: Boolean!
    dcMemberVerified: Boolean!
    verificationBadge: String!
    totalListings: Int!
    activeListings: Int!
    createdAt: String!
  }

  input UpdateProfileInput {
    name: String
    state: String
    city: String
    lga: String
  }

  input UpdatePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type Query {
    userProfile(userId: ID!): PublicProfile!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    updatePassword(input: UpdatePasswordInput!): Boolean!
    deleteAccount: Boolean!
  }
`;