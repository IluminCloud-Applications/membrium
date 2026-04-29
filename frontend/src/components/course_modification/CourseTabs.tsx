import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModulesTab } from "./ModulesTab";
import { CoverTab } from "./CoverTab";
import { MenuTab } from "./MenuTab";
import type { CourseModule, CourseCover, CourseMenuItem } from "@/types/course-modification";

interface CourseTabsProps {
    modules: CourseModule[];
    cover: CourseCover;
    menuItems: CourseMenuItem[];
    onAddModule: () => void;
    onEditModule: (mod: CourseModule) => void;
    onDeleteModule: (mod: CourseModule) => void;
    onAddLesson: (moduleId: number) => void;
    onEditLesson: (moduleId: number, lessonId: number) => void;
    onDeleteLesson: (moduleId: number, lessonId: number) => void;
    onReorderModules?: (orderedIds: number[]) => void;
    onReorderLessons?: (moduleId: number, orderedIds: number[]) => void;
    onCoverChange: (type: "desktop" | "mobile", file: File | null) => void;
    onCoverDelete: (type: "desktop" | "mobile") => void;
    onAddMenuItem: () => void;
    onEditMenuItem: (item: CourseMenuItem) => void;
    onDeleteMenuItem: (item: CourseMenuItem) => void;
    onBulkUpload?: (moduleId: number, platform: "youtube") => void;
    youtubeConnected?: boolean;
}

export function CourseTabs({
    modules,
    cover,
    menuItems,
    onAddModule,
    onEditModule,
    onDeleteModule,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onReorderModules,
    onReorderLessons,
    onCoverChange,
    onCoverDelete,
    onAddMenuItem,
    onEditMenuItem,
    onDeleteMenuItem,
    onBulkUpload,
    youtubeConnected,
}: CourseTabsProps) {
    return (
        <Tabs defaultValue="modules" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11">
                <TabsTrigger value="modules" className="gap-2 text-sm">
                    <i className="ri-folder-3-line" />
                    Módulos
                </TabsTrigger>
                <TabsTrigger value="cover" className="gap-2 text-sm">
                    <i className="ri-image-2-line" />
                    Cover
                </TabsTrigger>
                <TabsTrigger value="menu" className="gap-2 text-sm">
                    <i className="ri-menu-add-line" />
                    Menu
                </TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="mt-6">
                <ModulesTab
                    modules={modules}
                    onAddModule={onAddModule}
                    onEditModule={onEditModule}
                    onDeleteModule={onDeleteModule}
                    onAddLesson={onAddLesson}
                    onEditLesson={onEditLesson}
                    onDeleteLesson={onDeleteLesson}
                    onReorderModules={onReorderModules}
                    onReorderLessons={onReorderLessons}
                    onBulkUpload={onBulkUpload}
                    youtubeConnected={youtubeConnected}
                />
            </TabsContent>

            <TabsContent value="cover" className="mt-6">
                <CoverTab
                    cover={cover}
                    onCoverChange={onCoverChange}
                    onCoverDelete={onCoverDelete}
                />
            </TabsContent>

            <TabsContent value="menu" className="mt-6">
                <MenuTab
                    menuItems={menuItems}
                    onAddItem={onAddMenuItem}
                    onEditItem={onEditMenuItem}
                    onDeleteItem={onDeleteMenuItem}
                />
            </TabsContent>
        </Tabs>
    );
}
