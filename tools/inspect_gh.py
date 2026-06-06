import os
import traceback

import Rhino

GH_PATH = r"F:\毕业设计2\gh模型\parametric_phone_v2_sidefix.gh"
LOG_PATH = r"F:\毕业设计2\gripfit-onboarding\tmp-gh-inspect.log"


def write(line):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


try:
    if os.path.exists(LOG_PATH):
        os.remove(LOG_PATH)

    write("inspect:start")
    write("gh_path:" + GH_PATH)
    write("rhino_version:" + str(Rhino.RhinoApp.Version))

    import clr

    clr.AddReference("Grasshopper")
    import Grasshopper
    from Grasshopper.Kernel import GH_DocumentIO

    io = GH_DocumentIO()
    opened = io.Open(GH_PATH)
    write("opened:" + str(opened))

    doc = io.Document
    write("document:" + str(doc is not None))
    if doc is not None:
        write("object_count:" + str(doc.Objects.Count))
        for obj in doc.Objects:
            name = getattr(obj, "Name", "")
            nickname = getattr(obj, "NickName", "")
            description = getattr(obj, "Description", "")
            type_name = obj.GetType().FullName
            instance_guid = getattr(obj, "InstanceGuid", "")
            write("object|{0}|{1}|{2}|{3}|{4}".format(type_name, name, nickname, instance_guid, description))

            params = getattr(obj, "Params", None)
            if params is not None:
                for p in list(params.Input):
                    write("input|{0}|{1}|{2}|{3}|{4}".format(type_name, getattr(p, "Name", ""), getattr(p, "NickName", ""), getattr(p, "InstanceGuid", ""), getattr(p, "Description", "")))
                for p in list(params.Output):
                    write("output|{0}|{1}|{2}|{3}|{4}".format(type_name, getattr(p, "Name", ""), getattr(p, "NickName", ""), getattr(p, "InstanceGuid", ""), getattr(p, "Description", "")))

    write("inspect:done")
except Exception:
    write("inspect:error")
    write(traceback.format_exc())

Rhino.RhinoApp.Exit()
