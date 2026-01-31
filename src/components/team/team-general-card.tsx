"use client";

import { IconCheck, IconPencil } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TeamAvatar } from "@/components/team/team-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const IDENTIFIER_REGEX = /^[A-Z0-9]{2,6}$/;
const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const DEBOUNCE_MS = 500;
const IDENTIFIER_DEBOUNCE_MS = 300;

interface TeamGeneralCardProps {
  workspaceSlug: string;
  team: {
    id: string;
    name: string;
    identifier: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
}

function useTeamNameEditing(
  workspaceSlug: string,
  teamIdentifier: string,
  initialName: string
) {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveName = useCallback(
    async (newName: string) => {
      if (
        newName.length < MIN_NAME_LENGTH ||
        newName.length > MAX_NAME_LENGTH
      ) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSaving(true);

      try {
        const response = await fetch(
          `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to update team name");
          return;
        }

        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        toast.error("Failed to update team name");
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceSlug, teamIdentifier]
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      setShowSaved(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        saveName(value);
      }, DEBOUNCE_MS);
    },
    [saveName]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { name, handleNameChange, isSaving, showSaved };
}

function useTeamIdentifierEditing(
  workspaceSlug: string,
  teamIdentifier: string,
  teamId: string
) {
  const [identifier, setIdentifier] = useState(teamIdentifier);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(teamIdentifier);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    async (value: string) => {
      const normalized = value.toUpperCase();
      if (normalized === identifier) {
        setIsAvailable(true);
        setIsChecking(false);
        return;
      }

      if (!IDENTIFIER_REGEX.test(normalized)) {
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsChecking(true);

      try {
        const response = await fetch(
          `/api/team/identifier/check?identifier=${encodeURIComponent(normalized)}&workspaceSlug=${encodeURIComponent(workspaceSlug)}&excludeTeamId=${encodeURIComponent(teamId)}`,
          { signal: abortControllerRef.current.signal }
        );

        if (response.ok) {
          const data = await response.json();
          setIsAvailable(data.available);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      } finally {
        setIsChecking(false);
      }
    },
    [workspaceSlug, teamId, identifier]
  );

  const handleEditValueChange = useCallback(
    (value: string) => {
      const normalized = value.toUpperCase();
      setEditValue(normalized);
      setIsAvailable(null);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        checkAvailability(normalized);
      }, IDENTIFIER_DEBOUNCE_MS);
    },
    [checkAvailability]
  );

  const startEditing = useCallback(() => {
    setEditValue(identifier);
    setIsEditing(true);
    setIsAvailable(null);
  }, [identifier]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue(identifier);
    setIsAvailable(null);
  }, [identifier]);

  const saveIdentifier = useCallback(async () => {
    const normalized = editValue.toUpperCase();

    if (normalized === identifier) {
      setIsEditing(false);
      return;
    }

    if (!IDENTIFIER_REGEX.test(normalized)) {
      toast.error("Invalid identifier format");
      return;
    }

    if (isAvailable === false) {
      toast.error("This identifier is already taken");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: normalized }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to update identifier");
        return;
      }

      setIdentifier(normalized);
      setIsEditing(false);
      toast.success("Identifier updated. Redirecting...");
      window.location.href = `/${workspaceSlug}/settings/team/${normalized}`;
    } catch (_error) {
      toast.error("Failed to update identifier");
    } finally {
      setIsSaving(false);
    }
  }, [editValue, identifier, isAvailable, workspaceSlug, teamIdentifier]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    identifier,
    isEditing,
    editValue,
    isSaving,
    isChecking,
    isAvailable,
    handleEditValueChange,
    startEditing,
    cancelEditing,
    saveIdentifier,
  };
}

function useTeamDescriptionEditing(
  workspaceSlug: string,
  teamIdentifier: string,
  initialDescription: string | null
) {
  const [description, setDescription] = useState(initialDescription || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveDescription = useCallback(
    async (newDescription: string) => {
      if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSaving(true);

      try {
        const response = await fetch(
          `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newDescription || null }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to update description");
          return;
        }

        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        toast.error("Failed to update description");
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceSlug, teamIdentifier]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      setShowSaved(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        saveDescription(value);
      }, DEBOUNCE_MS);
    },
    [saveDescription]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { description, handleDescriptionChange, isSaving, showSaved };
}

export function TeamGeneralCard({ workspaceSlug, team }: TeamGeneralCardProps) {
  const {
    name,
    handleNameChange,
    isSaving: isNameSaving,
    showSaved: showNameSaved,
  } = useTeamNameEditing(workspaceSlug, team.identifier, team.name);

  const {
    identifier,
    isEditing: isIdentifierEditing,
    editValue: identifierEditValue,
    isSaving: isIdentifierSaving,
    isChecking: isIdentifierChecking,
    isAvailable: isIdentifierAvailable,
    handleEditValueChange: handleIdentifierEditValueChange,
    startEditing: startIdentifierEditing,
    cancelEditing: cancelIdentifierEditing,
    saveIdentifier,
  } = useTeamIdentifierEditing(workspaceSlug, team.identifier, team.id);

  const {
    description,
    handleDescriptionChange,
    isSaving: isDescriptionSaving,
    showSaved: showDescriptionSaved,
  } = useTeamDescriptionEditing(
    workspaceSlug,
    team.identifier,
    team.description
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Manage your team settings</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <TeamAvatar
            color={team.color}
            icon={team.icon}
            identifier={identifier}
            name={name}
            size="lg"
          />
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-sm">{identifier}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="team-name">Name</Label>
          <div className="relative">
            <Input
              id="team-name"
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Team name"
              value={name}
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              {isNameSaving && <Spinner className="size-4" />}
              {showNameSaved && !isNameSaving && (
                <IconCheck className="size-4 text-green-600" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="team-identifier">Identifier</Label>
          {isIdentifierEditing ? (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  className="uppercase"
                  id="team-identifier"
                  maxLength={6}
                  onChange={(e) =>
                    handleIdentifierEditValueChange(e.target.value)
                  }
                  value={identifierEditValue}
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  {isIdentifierChecking && <Spinner className="size-4" />}
                  {!isIdentifierChecking && isIdentifierAvailable === true && (
                    <span className="text-green-600 text-xs">Available</span>
                  )}
                  {!isIdentifierChecking && isIdentifierAvailable === false && (
                    <span className="text-red-600 text-xs">Taken</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={
                    isIdentifierSaving ||
                    isIdentifierChecking ||
                    isIdentifierAvailable === false
                  }
                  loading={isIdentifierSaving}
                  onClick={saveIdentifier}
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  disabled={isIdentifierSaving}
                  onClick={cancelIdentifierEditing}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                className="uppercase"
                disabled
                id="team-identifier"
                value={identifier}
              />
              <Button
                onClick={startIdentifierEditing}
                size="icon"
                variant="outline"
              >
                <IconPencil className="size-4" />
              </Button>
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            A short code for your team (2-6 characters). Used in URLs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="team-description">Description</Label>
            <span className="text-muted-foreground text-xs">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
          <div className="relative">
            <Textarea
              id="team-description"
              maxLength={MAX_DESCRIPTION_LENGTH}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="What does this team do?"
              rows={3}
              value={description}
            />
            <div className="absolute top-2 right-2">
              {isDescriptionSaving && <Spinner className="size-4" />}
              {showDescriptionSaved && !isDescriptionSaving && (
                <IconCheck className="size-4 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
