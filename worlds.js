var WorldsData = {
  "version": 1,
  "worlds": {
    "gate": {
      "id": "gate",
      "name": "NU Main Gate",
      "data": {
        "settings": {
          "activeRows": 5,
          "startSpirit": 100,
          "autoGenRate": 6,
          "autoGenAmount": 25,
          "waveCount": 3,
          "badgeFallRate": 7,
          "backdrop": "gate"
        },
        "waves": [
          {
            "delay": 4,
            "monsters": [
              {
                "kind": "ghost",
                "count": 3,
                "interval": 2.5
              }
            ]
          },
          {
            "delay": 25,
            "monsters": [
              {
                "kind": "ghost",
                "count": 4,
                "interval": 2
              },
              {
                "kind": "zombie",
                "count": 1,
                "interval": 3.5
              }
            ]
          },
          {
            "delay": 25,
            "monsters": [
              {
                "kind": "ghost",
                "count": 3,
                "interval": 2
              },
              {
                "kind": "zombie",
                "count": 3,
                "interval": 2.8
              }
            ]
          }
        ]
      }
    },
    "quad": {
      "id": "quad",
      "name": "NU Quadrangle",
      "data": {
        "settings": {
          "activeRows": 5,
          "startSpirit": 125,
          "autoGenRate": 6,
          "autoGenAmount": 25,
          "waveCount": 4,
          "badgeFallRate": 7,
          "backdrop": "quad"
        },
        "waves": [
          {
            "delay": 5,
            "monsters": [
              {
                "kind": "ghost",
                "count": 5,
                "interval": 2
              }
            ]
          },
          {
            "delay": 25,
            "monsters": [
              {
                "kind": "zombie",
                "count": 4,
                "interval": 2.5
              },
              {
                "kind": "skeleton",
                "count": 2,
                "interval": 3
              }
            ]
          },
          {
            "delay": 25,
            "monsters": [
              {
                "kind": "ghost",
                "count": 4,
                "interval": 1.8
              },
              {
                "kind": "skeleton",
                "count": 4,
                "interval": 2.2
              }
            ]
          },
          {
            "delay": 25,
            "monsters": [
              {
                "kind": "zombie",
                "count": 5,
                "interval": 2
              },
              {
                "kind": "skeleton",
                "count": 4,
                "interval": 2
              },
              {
                "kind": "ghost",
                "count": 3,
                "interval": 2.5
              }
            ]
          }
        ]
      }
    },
    "gym": {
      "id": "gym",
      "name": "NU Gymnasium",
      "data": {
        "settings": {
          "activeRows": 5,
          "startSpirit": 175,
          "autoGenRate": 5,
          "autoGenAmount": 25,
          "waveCount": 3,
          "badgeFallRate": 6,
          "backdrop": "gym"
        },
        "waves": [
          {
            "delay": 5,
            "monsters": [
              {
                "kind": "skeleton",
                "count": 4,
                "interval": 2
              },
              {
                "kind": "zombie",
                "count": 3,
                "interval": 2.5
              }
            ]
          },
          {
            "delay": 30,
            "monsters": [
              {
                "kind": "ghost",
                "count": 5,
                "interval": 1.8
              },
              {
                "kind": "skeleton",
                "count": 5,
                "interval": 2
              },
              {
                "kind": "zombie",
                "count": 3,
                "interval": 3
              }
            ]
          },
          {
            "delay": 35,
            "monsters": [
              {
                "kind": "pumpkinBoss",
                "count": 1,
                "interval": 1
              },
              {
                "kind": "skeleton",
                "count": 4,
                "interval": 3.5
              },
              {
                "kind": "ghost",
                "count": 4,
                "interval": 3
              }
            ]
          }
        ]
      }
    }
  },
  "connections": [
    {
      "id": "c1",
      "from": "gate",
      "to": "quad",
      "kind": "next"
    },
    {
      "id": "c2",
      "from": "quad",
      "to": "gym",
      "kind": "next"
    }
  ],
  "scenes": [],
  "multiLevel": true
};
