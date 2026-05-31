package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.dto.FileNode;
import com.distributed_lovable.workspace_service.entity.ProjectFile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ProjectFileMapperImpl implements ProjectFileMapper {

    @Override
    public List<FileNode> toListOfFileNode(List<ProjectFile> projectFileList) {
        if (projectFileList == null) {
            return null;
        }

        List<FileNode> list = new ArrayList<>(projectFileList.size());
        for (ProjectFile projectFile : projectFileList) {
            list.add(projectFileToFileNode(projectFile));
        }

        return list;
    }

    protected FileNode projectFileToFileNode(ProjectFile projectFile) {
        if (projectFile == null) {
            return null;
        }

        String path = projectFile.getPath();
        return new FileNode(path);
    }
}
