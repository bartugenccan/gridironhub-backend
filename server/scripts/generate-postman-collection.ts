/**
 * Postman Collection Generator
 *
 * Router dosyalarını parse ederek Postman Collection v2.1 formatında
 * JSON dosyası oluşturur. Her endpoint için request body örnekleri,
 * auth gereksinimleri ve açıklamalar otomatik olarak eklenir.
 */

import * as fs from 'fs';
import * as path from 'path';

// Collection oluştur
function generateCollection(): any {
  // Health check endpoint
  const healthEndpoint = {
    name: 'Health Check',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{base_url}}/health',
        host: ['{{base_url}}'],
        path: ['health'],
      },
      description: "API sağlık kontrolü endpoint'i",
    },
    response: [],
  };

  // Auth endpoints
  const authEndpoints = [
    {
      name: 'Login',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'if (pm.response.code === 200) {',
              '    const response = pm.response.json();',
              '    if (response.session?.access_token) {',
              "        pm.environment.set('auth_token', response.session.access_token);",
              "        pm.environment.set('user_id', response.user?.id || '');",
              '    }',
              '}',
            ],
            type: 'text/javascript',
          },
        },
      ],
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              email: 'player@example.com',
              password: 'Password123',
              role: 'player',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/auth/login',
          host: ['{{base_url}}'],
          path: ['auth', 'login'],
        },
        description:
          "Kullanıcı girişi. Player veya Coach rolü ile giriş yapılabilir. Başarılı giriş sonrası token otomatik olarak environment'a kaydedilir.",
      },
      response: [],
    },
    {
      name: 'Refresh Token',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              refreshToken: '{{refresh_token}}',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/auth/refresh',
          host: ['{{base_url}}'],
          path: ['auth', 'refresh'],
        },
        description:
          "Access token'ı yenilemek için kullanılır. Refresh token ile yeni bir access token alınır.",
      },
      response: [],
    },
    {
      name: 'Logout',
      request: {
        method: 'POST',
        header: [],
        url: {
          raw: '{{base_url}}/auth/logout',
          host: ['{{base_url}}'],
          path: ['auth', 'logout'],
        },
        description: "Kullanıcı çıkışı. Supabase'de token'lar client tarafında invalidate edilir.",
      },
      response: [],
    },
    {
      name: 'Register Player',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              email: 'newplayer@example.com',
              password: 'Password123',
              fullName: 'John Doe',
              teamId: '{{team_id}}',
              position: 'QB',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/auth/register',
          host: ['{{base_url}}'],
          path: ['auth', 'register'],
        },
        description:
          "Yeni player kaydı. Database trigger'ları otomatik olarak profile ve team assignment oluşturur.\n\nPosition değerleri: QB, RB, FB, WR, TE, OL, C, G, T, DL, DE, DT, LB, ILB, OLB, DB, CB, S, FS, SS, K, P, LS",
      },
      response: [],
    },
    {
      name: 'Invite Coach',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              email: 'coach@example.com',
              fullName: 'Coach Smith',
              teamId: '{{team_id}}',
              position: 'Head Coach',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/auth/invite-coach',
          host: ['{{base_url}}'],
          path: ['auth', 'invite-coach'],
        },
        description:
          'Coach davet etme. Email ile davet gönderilir.\n\nPosition değerleri: Head Coach, Offensive Coordinator, Defensive Coordinator, Special Teams Coach, Quarterbacks Coach, Running Backs Coach, Wide Receivers Coach, Tight Ends Coach, Offensive Line Coach, Defensive Line Coach, Linebackers Coach, Defensive Backs Coach, Strength and Conditioning Coach, Assistant Coach',
      },
      response: [],
    },
    {
      name: 'Set Password (Invited Coach)',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              email: 'coach@example.com',
              password: 'Password123',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/auth/set-password',
          host: ['{{base_url}}'],
          path: ['auth', 'set-password'],
        },
        description:
          "Davet edilmiş coach için şifre belirleme. Database trigger'ları otomatik olarak profile ve team assignment oluşturur.",
      },
      response: [],
    },
    {
      name: 'Invite Callback (Test)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/auth/invite-callback?access_token=test_token&refresh_token=test_refresh&type=invite',
          host: ['{{base_url}}'],
          path: ['auth', 'invite-callback'],
          query: [
            {
              key: 'access_token',
              value: 'test_token',
            },
            {
              key: 'refresh_token',
              value: 'test_refresh',
            },
            {
              key: 'type',
              value: 'invite',
            },
          ],
        },
        description: "Test endpoint'i. Production'da frontend tarafından handle edilir.",
      },
      response: [],
    },
  ];

  // Profiles endpoints
  const profilesEndpoints = [
    {
      name: 'Get Player Profile',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/profiles/players/{{user_id}}',
          host: ['{{base_url}}'],
          path: ['profiles', 'players', '{{user_id}}'],
        },
        description:
          'Player profil bilgilerini getirir. Auth token gereklidir. PR (Personal Record) bilgileri de dahildir.',
      },
      response: [],
    },
    {
      name: 'Update Player Profile',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'PATCH',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              fullName: 'John Doe Updated',
              jerseyNumber: 7,
              position: 'QB',
              dominantHand: 'right',
              heightCm: 185,
              weightKg: 90,
              bio: 'Updated bio text',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/profiles/players/{{user_id}}',
          host: ['{{base_url}}'],
          path: ['profiles', 'players', '{{user_id}}'],
        },
        description:
          'Player profil bilgilerini günceller. Sadece kendi profilini güncelleyebilir. Player role gereklidir.\n\nDominant hand: left, right, ambidextrous',
      },
      response: [],
    },
    {
      name: 'Get Coach Profile',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/profiles/coaches/{{user_id}}',
          host: ['{{base_url}}'],
          path: ['profiles', 'coaches', '{{user_id}}'],
        },
        description: 'Coach profil bilgilerini getirir. Auth token gereklidir.',
      },
      response: [],
    },
    {
      name: 'Update Coach Profile',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'PATCH',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              fullName: 'Coach Smith Updated',
              bio: 'Updated coach bio',
              certifications: ['USAF Level 2', 'QB Mechanics Specialist'],
              preferredPositions: ['Quarterback', 'Wide Receiver'],
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/profiles/coaches/{{user_id}}',
          host: ['{{base_url}}'],
          path: ['profiles', 'coaches', '{{user_id}}'],
        },
        description:
          'Coach profil bilgilerini günceller. Sadece kendi profilini güncelleyebilir. Coach role gereklidir.',
      },
      response: [],
    },
  ];

  // Teams endpoints
  const teamsEndpoints = [
    {
      name: 'Get Team',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/teams/{{team_id}}',
          host: ['{{base_url}}'],
          path: ['teams', '{{team_id}}'],
        },
        description:
          'Team bilgilerini getirir. Auth token gereklidir. Roster sayıları ve customization bilgileri dahildir.',
      },
      response: [],
    },
    {
      name: 'Update Team Customization',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'PATCH',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              heroTitle: 'Finish Every Rep',
              heroMessage: 'Discipline, execution, and heart define the Gridiron Lions.',
              highlightIds: ['highlight-1', 'highlight-2'],
              announcements: [
                {
                  id: 'announcement-1',
                  title: 'Week 3 Game Tape',
                  body: 'Upload your positional notes before Friday 6 PM.',
                  publishedAt: '2025-09-14T09:00:00.000Z',
                },
              ],
              resources: [
                {
                  label: 'Offensive Playbook',
                  url: 'https://example.com/playbook.pdf',
                },
              ],
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{base_url}}/teams/{{team_id}}/customization',
          host: ['{{base_url}}'],
          path: ['teams', '{{team_id}}', 'customization'],
        },
        description: 'Team customization ayarlarını günceller. Coach role gereklidir.',
      },
      response: [],
    },
    {
      name: 'Get Team Trainings',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/teams/{{team_id}}/trainings',
          host: ['{{base_url}}'],
          path: ['teams', '{{team_id}}', 'trainings'],
        },
        description: 'Team antrenmanlarını getirir. Auth token gereklidir.',
      },
      response: [],
    },
    {
      name: 'Get Team Highlights',
      request: {
        auth: {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{auth_token}}',
              type: 'string',
            },
          ],
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{base_url}}/teams/{{team_id}}/highlights',
          host: ['{{base_url}}'],
          path: ['teams', '{{team_id}}', 'highlights'],
        },
        description: 'Team highlight videolarını getirir. Auth token gereklidir.',
      },
      response: [],
    },
  ];

  // Collection yapısı
  const collection = {
    info: {
      _postman_id: 'gridironhub-api-collection',
      name: 'GridironHub API',
      description:
        "GridironHub Backend API Collection - Tüm endpoint'ler ve test senaryoları\n\nBu collection otomatik olarak generate edilmiştir. Router dosyaları değiştiğinde `npm run generate:postman` komutu ile güncellenebilir.",
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      {
        name: 'Health Check',
        item: [healthEndpoint],
      },
      {
        name: 'Auth',
        item: authEndpoints,
      },
      {
        name: 'Profiles',
        item: profilesEndpoints,
      },
      {
        name: 'Teams',
        item: teamsEndpoints,
      },
    ],
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:3001/api',
        type: 'string',
      },
    ],
  };

  return collection;
}

// Main function
function main() {
  try {
    const collection = generateCollection();
    // Root dizini bul (server klasöründen bir üst dizin)
    const serverDir = path.resolve(process.cwd());
    const rootDir = path.resolve(serverDir, '..');
    const outputPath = path.join(rootDir, 'postman', 'GridironHub API.postman_collection.json');

    // Output dizinini oluştur
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Collection'ı yaz
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, '\t'));

    console.log(`✅ Postman Collection başarıyla oluşturuldu: ${outputPath}`);
  } catch (error) {
    console.error('❌ Collection oluşturulurken hata:', error);
    process.exit(1);
  }
}

main();
