import { gql } from 'graphql-tag';

export default gql`
  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String
    phone: String
    password: String!
    state: String
    city: String
    referralCode: String
  }

  input LoginInput {
    email: String
    phone: String
    password: String!
  }

  extend type Query {
    me: User!
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    verifyEmail(token: String!): Boolean!
    verifyPhone(otp: String!): Boolean!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): AuthPayload!
  }
`;