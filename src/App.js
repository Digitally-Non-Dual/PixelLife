// src/App.js

import React, { useState, useCallback, useRef, useEffect } from 'react';
import produce from 'immer';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome

function App() {
  const numRows = 35; // Grid dimensions
  const numCols = 50;

  const colors = {
    active: '#00ff00',        // Bright green for active cells
    inactive: '#1a1a1a',      // Dark background color
    reproduction: '#00ffff',  // Cyan for newly born cells
    mature: '#ff00ff',        // Magenta for mature cells
  };

  // Increase speed by 30%
  const initialSpeed = 700; // Reduced from 1000ms to 700ms

  // Initialize grid
  const generateEmptyGrid = () => {
    return Array.from({ length: numRows }, () =>
      Array.from({ length: numCols }, () => ({
        alive: 0,
        age: 0,
      }))
    );
  };

  const [grid, setGrid] = useState(() => generateEmptyGrid());
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed); // Use the initialSpeed variable
  const [showTooltip, setShowTooltip] = useState(true);

  const runningRef = useRef(running);
  runningRef.current = running;

  // Neighbor positions relative to a cell
  const operations = [
    [0, 1], [0, -1],
    [1, -1], [-1, 1],
    [1, 1], [-1, -1],
    [1, 0], [-1, 0],
  ];

  // On first load, randomly activate a few cells
  useEffect(() => {
    const randomizeGrid = () => {
      const newGrid = produce(grid, (gridCopy) => {
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            if (Math.random() > 0.95) {
              gridCopy[i][j].alive = 1;
              gridCopy[i][j].age = 1;
            }
          }
        }
      });
      setGrid(newGrid);
    };

    randomizeGrid();

    // Fade out tooltip after 5 seconds
    const tooltipTimeout = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);

    return () => clearTimeout(tooltipTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulation function
  const runSimulation = useCallback(() => {
    if (!runningRef.current) {
      return;
    }

    setGrid((g) => {
      return produce(g, (gridCopy) => {
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            let neighbors = 0;
            operations.forEach(([x, y]) => {
              const newI = i + x;
              const newJ = j + y;
              if (newI >= 0 && newI < numRows && newJ >= 0 && newJ < numCols) {
                neighbors += g[newI][newJ].alive;
              }
            });

            const cell = g[i][j];

            // Implementing the game rules
            if (cell.alive === 1) {
              if (neighbors < 2 || neighbors > 3) {
                // Cell dies due to isolation or overcrowding
                gridCopy[i][j].alive = 0;
                gridCopy[i][j].age = 0;
              } else {
                // Cell remains alive and ages
                gridCopy[i][j].age = cell.age + 1;
              }
            } else {
              if (neighbors === 3) {
                // Cell becomes alive due to reproduction
                gridCopy[i][j].alive = 1;
                gridCopy[i][j].age = 1;
              }
            }
          }
        }
      });
    });

    setTimeout(runSimulation, speed);
  }, [numRows, numCols, operations, speed]);

  // Reset grid function
  const resetGrid = () => {
    setGrid(generateEmptyGrid());
  };

  // Event handlers
  const handleStartPause = () => {
    setRunning(!running);
    if (!running) {
      runningRef.current = true;
      runSimulation();
    } else {
      runningRef.current = false;
    }
  };

  const handleSpeedChange = (e) => {
    setSpeed(Number(e.target.value));
  };

  // Preserve the patterns and emojis for the rules column
  const patterns = [
    {
      emoji: '🥀', // Isolation (fewer than 2 neighbors)
      description: 'Isolation: < 2 neighbors',
      pattern: [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ],
    },
    {
      emoji: '🙂', // Growth (3 neighbors)
      description: 'Growth: 3 neighbors',
      pattern: [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
    },
    {
      emoji: '🌱', // Stability (2 or 3 neighbors)
      description: 'Stability: 2 or 3 neighbors',
      pattern: [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
    },
    {
      emoji: '🪁', // Glider (Rocket ship shape)
      description: 'Glider: Rocket ship shape',
      pattern: [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 1],
      ],
    },
    {
      emoji: '🧊', // Frozen death (4 or more neighbors)
      description: 'Frozen death: 4 or more neighbors',
      pattern: [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ],
    },
    {
      emoji: '💥', // Explody (4+ neighbors)
      description: 'Explody: > 3 neighbors',
      pattern: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
    },
  ];

  return (
    <div className="game">
      {/* Controls */}
      <h1>PixelLife</h1>
      <div className="controls">
        <button onClick={handleStartPause} title="Start or pause the simulation">
          {running ? <i className="fas fa-pause"></i> : <i className="fas fa-play"></i>}
        </button>
        <button onClick={resetGrid} title="Reset the grid">
          <i className="fas fa-redo"></i>
        </button>
        <div className="speed-control">
          <label>Speed:</label>
          <input
            type="range"
            min="100"
            max="2000"
            value={speed}
            onChange={handleSpeedChange}
            style={{
              background: `linear-gradient(to right, #00ffff 0%, #00ffff ${
                ((2000 - speed) / 1900) * 100
              }%, #333 ${((2000 - speed) / 1900) * 100}%, #333 100%)`,
            }}
          />
        </div>
      </div>
      {/* Game area containing the grid and the rules column */}
      <div className="game-area">
        {/* Grid */}
        <div
          className="grid"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            gridTemplateColumns: `repeat(${numCols}, 20px)`,
            position: 'relative',
          }}
        >
          {grid.map((rows, i) =>
            rows.map((col, j) => {
              const cell = grid[i][j];
              let cellColor = colors.inactive;
              let cellClass = 'cell';

              if (cell.alive) {
                if (cell.age === 1) {
                  cellColor = colors.reproduction;
                } else if (cell.age > 5) {
                  cellColor = colors.mature;
                  cellClass += ' mature';
                } else {
                  cellColor = colors.active;
                  cellClass += ' alive';
                }
              }

              return (
                <div
                  key={`${i}-${j}`}
                  className={cellClass}
                  onClick={() => {
                    const newGrid = produce(grid, (gridCopy) => {
                      const cell = gridCopy[i][j];
                      if (cell.alive) {
                        cell.alive = 0;
                        cell.age = 0;
                      } else {
                        cell.alive = 1;
                        cell.age = 1;
                      }
                    });
                    setGrid(newGrid);
                  }}
                  style={{
                    backgroundColor: cellColor,
                  }}
                />
              );
            })
          )}
          {showTooltip && (
            <div className="tooltip" style={{ top: -30, left: '50%', transform: 'translateX(-50%)' }}>
              Click to create life
            </div>
          )}
        </div>
        {/* Rules Column */}
        <div className="rules-column">
          {patterns.map((rule, index) => (
            <div className="rule" key={index}>
              <span className="emoji" title={rule.description}>{rule.emoji}</span>
              <div className="pattern">
                {rule.pattern.flat().map((cellValue, idx) => (
                  <div
                    key={idx}
                    className={`pattern-cell${cellValue ? ' active' : ''}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
