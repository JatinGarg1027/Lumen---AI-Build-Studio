package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.dto.FileNode;
import com.distributed_lovable.workspace_service.entity.ProjectFile;

import java.util.List;

public interface ProjectFileMapper {

    List<FileNode> toListOfFileNode(List<ProjectFile> projectFileList);
}
