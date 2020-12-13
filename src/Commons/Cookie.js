export const setCookie = (cname, cvalue) => {
    let d = new Date();
    d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const getCookie = (cname) => {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(cname));
    return cookieValue ? cookieValue.split('=')[1] : null;
}