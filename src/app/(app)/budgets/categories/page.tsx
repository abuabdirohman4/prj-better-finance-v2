"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { useManageCategories } from "./_hooks/useManageCategories";
import { CategoryBottomSheet } from "./_components/CategoryBottomSheet";
import { GroupRenameBottomSheet } from "./_components/GroupRenameBottomSheet";
import { Fab } from "@/components/layouts/Fab";
import { CATEGORY_GROUP_LABELS } from "@/lib/constants";
import type { ManageCategoryRow } from "@/db/queries/categories";

export default function ManageCategoriesPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [renameSheetOpen, setRenameSheetOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ManageCategoryRow | null>(null);
  const [editGroup, setEditGroup] = useState<string>("");
  const { query, upsertMutation, deleteMutation, renameGroupMutation } = useManageCategories();

  const categories = query.data ?? [];

  const groups = categories.reduce<Record<string, ManageCategoryRow[]>>((acc, c) => {
    const g = c.group_name || "others";
    (acc[g] ??= []).push(c);
    return acc;
  }, {});

  const existingGroups = Object.keys(groups);

  function openCreate() { setEditCategory(null); setSheetOpen(true); }
  function openEdit(c: ManageCategoryRow) { setEditCategory(c); setSheetOpen(true); }
  function openRenameGroup(g: string) { setEditGroup(g); setRenameSheetOpen(true); }

  return (
    <div className="bg-blue-50 min-h-screen pb-24">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 pt-5 pb-6">
        <div className="absolute bottom-0 left-0 w-full h-8">
          <svg viewBox="0 0 400 32" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,32 Q100,20 200,32 T400,20 L400,32 Z" fill="rgb(239 246 255)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center">
          <Link href="/budgets" className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Back">
            <ChevronLeft className="w-7 h-7 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Manage Categories</h1>
            <p className="text-blue-100 text-sm">Add, edit, or remove categories</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {query.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-white rounded-2xl h-16 shadow-sm" />)}
          </div>
        )}

        {!query.isLoading && categories.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm">No categories yet.</p>
            <p className="text-gray-400 text-xs mt-1">Tap + to add one.</p>
          </div>
        )}

        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 capitalize text-base">
                {CATEGORY_GROUP_LABELS[group as keyof typeof CATEGORY_GROUP_LABELS] ?? group}
              </h3>
              <button 
                onClick={() => openRenameGroup(group)}
                className="p-1.5 rounded-md hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-colors"
                title="Rename Group"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {items.map((c) => (
                <button key={c.id} onClick={() => openEdit(c)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-gray-800">{c.name}</span>
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Fab onClick={openCreate} label="Add category" />

      <CategoryBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editCategory={editCategory}
        existingGroups={existingGroups}
        onSuccess={() => setSheetOpen(false)}
        upsertMutation={upsertMutation}
        deleteMutation={deleteMutation}
      />

      <GroupRenameBottomSheet
        open={renameSheetOpen}
        onClose={() => setRenameSheetOpen(false)}
        oldGroup={editGroup}
        onSuccess={() => setRenameSheetOpen(false)}
        renameMutation={renameGroupMutation}
      />
    </div>
  );
}
