import { gql } from 'graphql-tag';

export default gql`
  type CategoryField {
    name: String!
    label: String!
    type: String!
    options: [String!]
    required: Boolean!
    order: Int!
  }

  type Category {
    _id: ID!
    name: String!
    slug: String!
    description: String
    icon: String
    image: String
    parent: Category
    subcategories: [Category!]
    isActive: Boolean!
    order: Int!
    isHighRisk: Boolean!
    customFields: [CategoryField!]!
    totalListings: Int!
    activeListings: Int!
  }

  input CreateCategoryInput {
    name: String!
    slug: String!
    description: String
    icon: String
    parent: ID
    order: Int
    isHighRisk: Boolean
  }

  extend type Query {
    categories: [Category!]!
    category(slug: String!): Category!
  }

  extend type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: CreateCategoryInput!): Category!
  }
`;