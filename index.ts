import { Hono, Context } from "hono"
import { logger } from "hono/logger"
import { readdir } from "node:fs"

const app: Hono = new Hono()
const upTime: Date = new Date()

const listFiles = async(directory: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        readdir("files/" + directory, (err, files) => {
            err ?  reject(err) : resolve(files)
        })
    })
}

const getRandomFile = (array: string[]): string => {
    return array[Math.floor(Math.random() * array.length)]
}

function timeDifference(timestamp: number) {
    const msPerMinute = 60 * 1000
    const msPerHour = msPerMinute * 60
    const msPerDay = msPerHour * 24

    const elapsed = (upTime.getTime() - timestamp) * -1

    const rtf = new Intl.RelativeTimeFormat("en-GB", { style: "long", numeric: "always" })

    if (elapsed < msPerMinute) {
        return rtf.format(-Math.floor(elapsed/1000), "seconds")
    } else if (elapsed < msPerHour) {
        return rtf.format(-Math.floor(elapsed/msPerMinute), "minutes")
    } else if (elapsed < msPerDay) {
        return rtf.format(-Math.floor(elapsed/msPerHour), "hours")
    }

    return rtf.format(-Math.floor(elapsed/msPerDay), "days")
}

const contentTypes: { [key: string]: string } = {
    "png": "image/png",
    "jpg": "image/jpg",
    "mp4": "video/mp4",
    "webm": "video/webm"
}

const directories: { [key: string]: string[] } = {
    sfw: await listFiles("sfw"),
    nsfw: await listFiles("nsfw"),
    sador: await listFiles("sador")
}

const jokes = await Bun.file("startitzart.json").json()

app.use("*", logger())

app.get("/api/", (ctx: Context) => {
    return ctx.json({
        status: 200,
        message: "astolfo.poligon.lgbt - sfw/nsfw random astofo picture api",
        author: "PoligonTeam",
        version: "1.0.0",
        source: "https://github.com/PoligonTeam/astolfo.poligon.lgbt",
        upTime: {
            "text": timeDifference(new Date().getTime()),
            "timestamp": upTime.getTime()
        },
        poweredBy: [
            "astolfo pictures",
            "sador cringetoks",
            "bun",
            "honojs",
            "typescript",
            "nginx"
        ],
        availableEndpoints: {
            "/sfw": "safe-for-work random astolfo picture",
            "/nsfw": "not-safe-for-work random astolfo picture",
            "/startit": "random startit joke",
            "/sador": "random sador tiktok"
        },
        count: {
            sfw: directories.sfw.length,
            nsfw: directories.nsfw.length,
            startit: jokes.length,
            sador: directories.sador.length
        }
    })
})

app.get("/api/:directory", (ctx: Context) => {
    const { directory } = ctx.req.param()

    if (directory.toLowerCase() === "startit") {
        const joke: string = jokes[Math.floor(Math.random() * jokes.length)]

        return ctx.json({
            status: 200,
            joke: joke
        })
    }

    const files = directories[directory]

    if (files === void 0) {
        return ctx.notFound()
    }

    const filename: string = getRandomFile(files)

    return ctx.json({
        status: 200,
        url: "https://astolfo.poligon.lgbt/cdn/" + directory + "/" + filename
    })
})

app.get("/cdn/:directory/:filename", (ctx: Context) => {
    const { directory, filename } = ctx.req.param()

    if (directories[directory] === void 0 || !directories[directory].includes(filename)) {
        return ctx.notFound()
    }

    const path: string = "files/" + directory + "/" + filename

    return new Response(Bun.file(path),  { headers: { "Content-Type": contentTypes[filename.split(".")[-1]] } })
})

app.notFound((ctx: Context) => {
    return ctx.json({ status: 404, message: "not found" }, 404)
})

app.onError((err: Error, ctx: Context) => {
    return ctx.json({ status: 500, message: err.cause }, 500)
})

export default {
    port: 6968,
    fetch: app.fetch,
}

console.log("app running on port 6968")