# Callionica Media File System (WIP)

The "Callionica Media File System" (**CMFS**) is a set of rules for connecting multiple files into 
a single entity, so that separate audio, video, text, subtitle, and image files can all be treated
as one item.

CMFS does this using only the file name and local directory structure to store data and metadata.

CMFS also allows for files found in multiple different folders to be recognized as part of a single entity.

It works like this:

A **media item** is an audio or video file.
An audio or video file is recognized by its file exension.

A **satellite item** is a text, image, subtitle, or other file whose name is prefixed by the name of a media item followed by a period.

A **tag list** is a period-separated list of tags that can appear as a suffix to the file name of a satellite item.

A **tag** is just some text that does not contain a period. Examples include language tags like *en* or *da* to specify the language for subtitles, or image tags like *poster* or *backdrop*.

A **collection** is defined by the folder in which a media item finds itself.

A **collection satellite item** is a file contained directly within a collection folder or in the parent of that folder whose name is prefixed by the name of the collection followed by a period.

A **group** is the major grouping for media items. For example, a show (for television) or an artist (for music) or the author (for an audiobook). The group is recognized by using a regular expression to parse the media item's filename. If no group is recognized from the file name, the name of the grandparent folder is the name of the group.

A **group satellite item** is a file in the same folder as the media item or in the parent of that folder whose name is prefixed by the name of the group followed by a period.

A **subgroup** is the minor grouping for media items. For example, a season (for television) or an album (for music) or the book (for an audiobook). The subgroup is recognized by using a regular expression to parse the media item's filename. If no subgroup is recognized from the file name, the name of the parent folder is the name of the subgroup.

A **subgroup satellite item** is a file in the same folder as the media item or in the parent of that folder whose name is prefixed by the name of the subgroup followed by a period.

