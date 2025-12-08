"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  GameMap,
  Building,
  NPC,
  Zone,
  Road,
  Position,
  BuildingType,
  RoadType,
  ZoneType,
} from "../game/types";

type EditorMode = "select" | "building" | "npc" | "road" | "zone" | "preview";

interface EditorState {
  mode: EditorMode;
  selectedItem: string | null;
  isDragging: boolean;
  dragStart: Position | null;
}

export default function MapEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapData, setMapData] = useState<GameMap | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [editorState, setEditorState] = useState<EditorState>({
    mode: "select",
    selectedItem: null,
    isDragging: false,
    dragStart: null,
  });
  const [newItemType, setNewItemType] = useState<BuildingType | "">("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [zoom, setZoom] = useState(0.5);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mapRes, buildingsRes, npcsRes] = await Promise.all([
          fetch("/api/game/map"),
          fetch("/api/game/buildings"),
          fetch("/api/game/npcs"),
        ]);

        const mapJson = await mapRes.json();
        const buildingsJson = await buildingsRes.json();
        const npcsJson = await npcsRes.json();

        setMapData(mapJson);
        setBuildings(buildingsJson);
        setNpcs(npcsJson);
        setStatusMessage("Data loaded successfully");
      } catch (error) {
        console.error("Error loading data:", error);
        setStatusMessage("Error loading data");
      }
    };

    loadData();
  }, []);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw background
    ctx.fillStyle = "#1a472a";
    ctx.fillRect(0, 0, mapData.width, mapData.height);

    // Draw grid
    ctx.strokeStyle = "#2a5a3a";
    ctx.lineWidth = 1;
    for (let x = 0; x < mapData.width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapData.height);
      ctx.stroke();
    }
    for (let y = 0; y < mapData.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapData.width, y);
      ctx.stroke();
    }

    // Draw zones
    mapData.zones?.forEach((zone) => {
      const width = zone.bounds.maxX - zone.bounds.minX;
      const height = zone.bounds.maxY - zone.bounds.minY;

      ctx.fillStyle = zone.color + "44";
      ctx.fillRect(zone.bounds.minX, zone.bounds.minY, width, height);

      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.bounds.minX, zone.bounds.minY, width, height);

      ctx.fillStyle = zone.color;
      ctx.font = "14px Arial";
      ctx.fillText(zone.name, zone.bounds.minX + 10, zone.bounds.minY + 20);
    });

    // Draw roads
    mapData.roads?.forEach((road) => {
      const color =
        road.type === "autobahn"
          ? "#4a5568"
          : road.type === "hauptstrasse"
            ? "#718096"
            : "#a0aec0";

      ctx.strokeStyle = color;
      ctx.lineWidth = road.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(road.points[0].x, road.points[0].y);
      for (let i = 1; i < road.points.length; i++) {
        ctx.lineTo(road.points[i].x, road.points[i].y);
      }
      ctx.stroke();
    });

    // Draw buildings
    buildings.forEach((building) => {
      const isSelected = editorState.selectedItem === building.id;
      const color = building.color || "#4a5568";

      ctx.fillStyle = color;
      ctx.fillRect(
        building.position.x - building.width / 2,
        building.position.y - building.height / 2,
        building.width,
        building.height,
      );

      if (isSelected) {
        ctx.strokeStyle = "#76b900";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          building.position.x - building.width / 2 - 2,
          building.position.y - building.height / 2 - 2,
          building.width + 4,
          building.height + 4,
        );
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        building.name,
        building.position.x,
        building.position.y - building.height / 2 - 5,
      );
    });

    // Draw NPCs
    npcs.forEach((npc) => {
      const isSelected = editorState.selectedItem === npc.id;
      const color = npc.color || "#f6e05e";

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(npc.position.x, npc.position.y, 15, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#76b900";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(npc.position.x, npc.position.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(npc.name, npc.position.x, npc.position.y - 20);
    });

    // Draw spawn point
    ctx.fillStyle = "#76b900";
    ctx.beginPath();
    ctx.arc(
      mapData.spawnPosition.x,
      mapData.spawnPosition.y,
      20,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SPAWN", mapData.spawnPosition.x, mapData.spawnPosition.y + 5);

    ctx.restore();
  }, [mapData, buildings, npcs, editorState, zoom, offset]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !mapData) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      if (editorState.mode === "building" && newItemType) {
        const newBuilding: Building = {
          id: `building-${Date.now()}`,
          type: newItemType as BuildingType,
          name: `New ${newItemType}`,
          position: { x, y },
          width: 80,
          height: 60,
          color: "#718096",
          interactable: true,
        };
        setBuildings((prev) => [...prev, newBuilding]);
        setEditorState((prev) => ({
          ...prev,
          selectedItem: newBuilding.id,
        }));
        setStatusMessage(`Added building: ${newBuilding.name}`);
      } else if (editorState.mode === "npc") {
        const newNpc: NPC = {
          id: `npc-${Date.now()}`,
          name: "New NPC",
          position: { x, y },
          color: "#f6e05e",
          dialogues: [
            {
              id: "intro",
              text: "Hello, traveler!",
            },
          ],
        };
        setNpcs((prev) => [...prev, newNpc]);
        setEditorState((prev) => ({ ...prev, selectedItem: newNpc.id }));
        setStatusMessage(`Added NPC: ${newNpc.name}`);
      } else if (editorState.mode === "select") {
        // Check if clicked on a building
        const clickedBuilding = buildings.find((b) => {
          const halfW = b.width / 2;
          const halfH = b.height / 2;
          return (
            x >= b.position.x - halfW &&
            x <= b.position.x + halfW &&
            y >= b.position.y - halfH &&
            y <= b.position.y + halfH
          );
        });

        // Check if clicked on an NPC
        const clickedNpc = npcs.find((n) => {
          const dx = x - n.position.x;
          const dy = y - n.position.y;
          return Math.sqrt(dx * dx + dy * dy) <= 15;
        });

        if (clickedBuilding) {
          setEditorState((prev) => ({
            ...prev,
            selectedItem: clickedBuilding.id,
          }));
        } else if (clickedNpc) {
          setEditorState((prev) => ({ ...prev, selectedItem: clickedNpc.id }));
        } else {
          setEditorState((prev) => ({ ...prev, selectedItem: null }));
        }
      }
    },
    [editorState.mode, mapData, buildings, npcs, newItemType, zoom, offset],
  );

  // Handle canvas drag for moving items
  const handleCanvasDrag = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.buttons !== 1 || !editorState.selectedItem) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;

      // Move selected building
      const buildingIndex = buildings.findIndex(
        (b) => b.id === editorState.selectedItem,
      );
      if (buildingIndex !== -1) {
        setBuildings((prev) =>
          prev.map((b, i) =>
            i === buildingIndex ? { ...b, position: { x, y } } : b,
          ),
        );
        return;
      }

      // Move selected NPC
      const npcIndex = npcs.findIndex((n) => n.id === editorState.selectedItem);
      if (npcIndex !== -1) {
        setNpcs((prev) =>
          prev.map((n, i) =>
            i === npcIndex ? { ...n, position: { x, y } } : n,
          ),
        );
      }
    },
    [editorState.selectedItem, buildings, npcs, zoom, offset],
  );

  // Handle canvas pan
  const handleCanvasPan = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (e.ctrlKey) {
        // Zoom with ctrl+scroll
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.1, Math.min(2, prev + delta)));
      } else {
        // Pan
        setOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [],
  );

  // Save all data
  const handleSave = async () => {
    setSaving(true);
    setStatusMessage("Saving...");

    try {
      await Promise.all([
        fetch("/api/game/map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapData),
        }),
        fetch("/api/game/buildings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildings),
        }),
        fetch("/api/game/npcs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(npcs),
        }),
      ]);

      setStatusMessage("Saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      setStatusMessage("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  // Delete selected item
  const handleDelete = () => {
    if (!editorState.selectedItem) return;

    setBuildings((prev) =>
      prev.filter((b) => b.id !== editorState.selectedItem),
    );
    setNpcs((prev) => prev.filter((n) => n.id !== editorState.selectedItem));
    setStatusMessage("Item deleted");
    setEditorState((prev) => ({ ...prev, selectedItem: null }));
  };

  // Get selected item details
  const getSelectedItem = () => {
    const building = buildings.find((b) => b.id === editorState.selectedItem);
    if (building) return { type: "building", data: building };

    const npc = npcs.find((n) => n.id === editorState.selectedItem);
    if (npc) return { type: "npc", data: npc };

    return null;
  };

  const selectedItem = getSelectedItem();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#fff",
      }}
    >
      {/* Left Toolbar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#1a1a2e",
          padding: "20px",
          borderRight: "1px solid #333",
          overflowY: "auto",
        }}
      >
        <h1
          style={{ fontSize: "20px", marginBottom: "20px", color: "#76b900" }}
        >
          🗺️ Map Editor
        </h1>

        {/* Mode Selection */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#888" }}>
            Mode
          </h3>
          {(["select", "building", "npc", "preview"] as EditorMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() =>
                  setEditorState((prev) => ({
                    ...prev,
                    mode,
                    selectedItem: null,
                  }))
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px",
                  marginBottom: "5px",
                  backgroundColor:
                    editorState.mode === mode ? "#76b900" : "#2a2a3e",
                  color: editorState.mode === mode ? "#000" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {mode === "select" && "🖱️ Select"}
                {mode === "building" && "🏢 Add Building"}
                {mode === "npc" && "👤 Add NPC"}
                {mode === "preview" && "▶️ Preview"}
              </button>
            ),
          )}
        </div>

        {/* Building Type Selection */}
        {editorState.mode === "building" && (
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{ fontSize: "14px", marginBottom: "10px", color: "#888" }}
            >
              Building Type
            </h3>
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value as BuildingType)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#2a2a3e",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "6px",
              }}
            >
              <option value="">Select type...</option>
              <option value="factory">🏭 Factory</option>
              <option value="house">🏠 House</option>
              <option value="church">⛪ Church</option>
              <option value="museum">🏛️ Museum</option>
              <option value="shop">🏪 Shop</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="hospital">🏥 Hospital</option>
              <option value="school">🏫 School</option>
              <option value="office">🏢 Office</option>
              <option value="historical">🏰 Historical</option>
            </select>
          </div>
        )}

        {/* Selected Item Properties */}
        {selectedItem && (
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{ fontSize: "14px", marginBottom: "10px", color: "#888" }}
            >
              Properties
            </h3>
            <div
              style={{
                backgroundColor: "#2a2a3e",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <label style={{ display: "block", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#888" }}>Name</span>
                <input
                  type="text"
                  value={
                    selectedItem.type === "building"
                      ? (selectedItem.data as Building).name
                      : (selectedItem.data as NPC).name
                  }
                  onChange={(e) => {
                    if (selectedItem.type === "building") {
                      setBuildings((prev) =>
                        prev.map((b) =>
                          b.id === editorState.selectedItem
                            ? { ...b, name: e.target.value }
                            : b,
                        ),
                      );
                    } else {
                      setNpcs((prev) =>
                        prev.map((n) =>
                          n.id === editorState.selectedItem
                            ? { ...n, name: e.target.value }
                            : n,
                        ),
                      );
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#1a1a2e",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    marginTop: "4px",
                  }}
                />
              </label>

              {selectedItem.type === "building" && (
                <>
                  <label style={{ display: "block", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      Description
                    </span>
                    <textarea
                      value={(selectedItem.data as Building).description || ""}
                      onChange={(e) => {
                        setBuildings((prev) =>
                          prev.map((b) =>
                            b.id === editorState.selectedItem
                              ? { ...b, description: e.target.value }
                              : b,
                          ),
                        );
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: "#1a1a2e",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        marginTop: "4px",
                        minHeight: "60px",
                        resize: "vertical",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      Width
                    </span>
                    <input
                      type="number"
                      value={(selectedItem.data as Building).width}
                      onChange={(e) => {
                        setBuildings((prev) =>
                          prev.map((b) =>
                            b.id === editorState.selectedItem
                              ? { ...b, width: parseInt(e.target.value) || 80 }
                              : b,
                          ),
                        );
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: "#1a1a2e",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        marginTop: "4px",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      Height
                    </span>
                    <input
                      type="number"
                      value={(selectedItem.data as Building).height}
                      onChange={(e) => {
                        setBuildings((prev) =>
                          prev.map((b) =>
                            b.id === editorState.selectedItem
                              ? { ...b, height: parseInt(e.target.value) || 60 }
                              : b,
                          ),
                        );
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: "#1a1a2e",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        marginTop: "4px",
                      }}
                    />
                  </label>
                </>
              )}

              <button
                onClick={handleDelete}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#fc8181",
                  color: "#000",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: saving ? "#4a5568" : "#48bb78",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          {saving ? "💾 Saving..." : "💾 Save to Redis"}
        </button>

        {/* Status Message */}
        {statusMessage && (
          <p
            style={{
              marginTop: "15px",
              padding: "10px",
              backgroundColor: "#2a2a3e",
              borderRadius: "6px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {statusMessage}
          </p>
        )}

        {/* Zoom Controls */}
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#888" }}>
            Zoom: {Math.round(zoom * 100)}%
          </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.1))}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "#2a2a3e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              -
            </button>
            <button
              onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "#2a2a3e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(0.5);
                setOffset({ x: 0, y: 0 });
              }}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "#2a2a3e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Help */}
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#2a2a3e",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#888",
          }}
        >
          <h4 style={{ marginBottom: "10px", color: "#fff" }}>Tips</h4>
          <ul style={{ margin: 0, paddingLeft: "15px" }}>
            <li>Click to place items</li>
            <li>Drag to move selected items</li>
            <li>Scroll to pan the map</li>
            <li>Ctrl+Scroll to zoom</li>
          </ul>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasDrag}
          onWheel={handleCanvasPan}
          style={{
            width: "100%",
            height: "100%",
            cursor: editorState.mode === "select" ? "default" : "crosshair",
          }}
        />

        {/* Mode indicator */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px 15px",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          Mode: <strong>{editorState.mode.toUpperCase()}</strong>
        </div>

        {/* Stats */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px 15px",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        >
          Buildings: {buildings.length} | NPCs: {npcs.length} | Zones:{" "}
          {mapData?.zones?.length || 0}
        </div>
      </div>
    </div>
  );
}
