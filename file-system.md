# Callionica Media File System

The "Callionica Media File System" (**CMFS**) is a set of rules for connecting multiple files into 
a single entity, so that separate audio, video, text, subtitle, and image files can all be treated
as one item.

CMFS does this using only the file name to store data and metadata.

CMFS also allows for files found in multiple different folders to be recognized as part of a single entity.

It works like this:

A **media item** is an audio or video file.
An audio or video file is recognized by its file exension.

A **satellite item** is a text, image, subtitle, or other file whose name is prefixed by the name of a media item followed by a period.

A **tag list** is a period-separated list of tags that can appear as a suffix to the file name of a satellite item.

A **tag** is just some text that does not contain a period. Examples include language tags to specify the language for subtitles,
or image use tags like *poster* or *backdrop*.
