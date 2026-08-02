import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize the MCP server
const server = new Server(
  {
    name: 'studymate-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools available in StudyMate
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_notes',
        description: 'Fetch all study notes from the StudyMate database.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_note',
        description: 'Create a new study note in StudyMate.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the note',
            },
            subject: {
              type: 'string',
              description: 'Subject or category of the note (e.g., Physics, Biology, History)',
            },
            content: {
              type: 'string',
              description: 'The body content of the study note',
            },
          },
          required: ['title', 'content'],
        },
      },
    ],
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'list_notes') {
      const response = await fetch('http://localhost:5000/api/notes');
      
      if (!response.ok) {
        throw new Error(`Failed to list notes. API server returned status: ${response.status}`);
      }

      const notes = await response.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    } else if (name === 'create_note') {
      const { title, subject, content } = args || {};

      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, subject, content }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create note. API error: ${errBody.error || response.statusText}`
        );
      }

      const newNote = await response.json();
      return {
        content: [
          {
            type: 'text',
            text: `Study note created successfully!\n\n${JSON.stringify(newNote, null, 2)}`,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing tool '${name}': ${error.message}`,
        },
      ],
    };
  }
});

// Setup and start transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Log to stderr because stdout is reserved for JSON-RPC messages
console.error('StudyMate MCP Server running on stdio');
